"""P6 QC — the submission gate for the rendered video.

Usage:
  uv run python src/py/qc_video.py video/out/digital-land-animatic.mp4 --mode animatic
  uv run python src/py/qc_video.py video/out/digital-land-final.mp4 --mode final

Checks (assert-style, like every pipeline step):
  1. format: duration within the 3-5 min contest bound, 1920x1080@30, h264
  2. final mode: metadata scrub -> *-clean.mp4 (the ONLY file that leaves the repo)
  3. identity grep over video sources, baked data, and the clean file's metadata
  4. bake determinism (two runs, identical hash)
  5. loudness advisory (final mode, warn only)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Kept here (repo-private, never bundled into the video): patterns that must
# not appear in any deliverable artifact (contest anonymity rule).
IDENTITY_PATTERNS = [
    r"damian", r"krotov", r"krformula", r"DamianKrotov", r"@gmail",
]

HARD_MIN, HARD_MAX = 180.0, 300.0


def ffprobe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def check_format(path: Path, mode: str) -> None:
    info = ffprobe(path)
    dur = float(info["format"]["duration"])
    assert HARD_MIN <= dur <= HARD_MAX, f"duration {dur:.1f}s outside contest bound [{HARD_MIN},{HARD_MAX}]"
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    assert (v["width"], v["height"]) == (1920, 1080), f"resolution {v['width']}x{v['height']}"
    assert v["codec_name"] == "h264", f"codec {v['codec_name']}"
    assert v["r_frame_rate"] == "30/1", f"fps {v['r_frame_rate']}"
    has_audio = any(s["codec_type"] == "audio" for s in info["streams"])
    if mode == "final":
        assert has_audio, "final render has no audio stream"
    print(f"format ok: {dur:.1f}s, 1920x1080@30 h264, audio={has_audio}")


def scrub_metadata(path: Path) -> Path:
    clean = path.with_name(path.stem + "-clean.mp4")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(path),
         "-map_metadata", "-1", "-fflags", "+bitexact", "-movflags", "+faststart",
         "-c", "copy", str(clean)],
        check=True,
    )
    tags = ffprobe(clean)["format"].get("tags", {})
    boiler = {"major_brand", "minor_version", "compatible_brands", "encoder", "duration"}
    extra = {k: v for k, v in tags.items() if k.lower() not in boiler}
    assert not extra, f"metadata survived scrub: {extra}"
    print(f"metadata scrub ok -> {clean.name} (tags: {list(tags) or 'none'})")
    return clean


def check_identity(clean: Path | None, mode: str) -> None:
    rx = re.compile("|".join(IDENTITY_PATTERNS), re.IGNORECASE)
    hits: list[str] = []
    scan_paths = [ROOT / "video/src", ROOT / "video/public"]
    for base in scan_paths:
        for f in base.rglob("*"):
            if f.is_file() and f.suffix in {".ts", ".tsx", ".json", ".txt", ".md"}:
                for m in rx.finditer(f.read_text(errors="ignore")):
                    hits.append(f"{f.relative_to(ROOT)}: ...{m.group(0)}...")
    baked = ROOT / "video/src/data/video_data.json"
    # drafts may carry TODO_VERIFY facts; the FINAL artifact must not
    if mode == "final" and "TODO_VERIFY" in baked.read_text():
        hits.append(f"{baked.relative_to(ROOT)}: contains TODO_VERIFY (unresolved fact)")
    if clean is not None:
        probe_text = json.dumps(ffprobe(clean))
        hits.extend(f"clean.mp4 metadata: {m.group(0)}" for m in rx.finditer(probe_text))
    assert not hits, "identity/TODO leakage:\n  " + "\n  ".join(hits)
    print("identity grep ok: no name/school/email/TODO strings in video sources or metadata")


def check_determinism() -> None:
    baked = ROOT / "video/src/data/video_data.json"
    h1 = hashlib.sha256(baked.read_bytes()).hexdigest()
    subprocess.run(
        ["uv", "run", "python", "src/py/make_video_data.py"],
        cwd=ROOT, check=True, capture_output=True,
    )
    h2 = hashlib.sha256(baked.read_bytes()).hexdigest()
    assert h1 == h2, "video_data.json is not deterministic across bakes"
    print(f"bake determinism ok: {h1[:16]}")


def check_loudness(path: Path) -> None:
    out = subprocess.run(
        ["ffmpeg", "-i", str(path), "-af", "loudnorm=I=-16:TP=-1.5:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    m = re.search(r"\{[^}]+\}", out[out.rfind("input_i") - 200:] if "input_i" in out else "")
    if not m:
        print("loudness: could not measure (skipping advisory)")
        return
    lufs = float(json.loads(m.group(0))["input_i"])
    if not (-20 <= lufs <= -12):
        print(f"loudness ADVISORY: integrated {lufs:.1f} LUFS outside [-20,-12] — consider re-mixing")
    else:
        print(f"loudness ok: {lufs:.1f} LUFS")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video", type=Path)
    ap.add_argument("--mode", choices=["animatic", "final"], required=True)
    args = ap.parse_args()
    assert args.video.exists(), f"{args.video} not found — render first"

    if args.mode == "final":
        baked = json.loads((ROOT / "video/src/data/video_data.json").read_text())
        assert baked["meta"]["facts_verified"] is True, \
            "final QC refused: refs/video_facts.json unverified (flip + rebake first)"

    check_format(args.video, args.mode)
    clean = scrub_metadata(args.video) if args.mode == "final" else None
    check_identity(clean, args.mode)
    check_determinism()
    if args.mode == "final":
        check_loudness(clean or args.video)
    print(f"qc_video: ALL CHECKS PASSED ({args.mode} mode)"
          + (f" — submit {clean.name}" if clean else ""))


if __name__ == "__main__":
    main()
