"""Download raw inputs: Zillow ZHVI (ZIP monthly SA), Census ZCTA boundaries, ACS covariates.

Idempotent: skips files that already exist unless --force.
Redfin robustness file is large (~1 GB) and only fetched with --redfin.

Guardrail: if a pinned URL 404s, this script STOPS with instructions —
it never guesses an alternative URL silently (CLAUDE.md hard guardrail #3).
"""

from __future__ import annotations

import argparse
import io
import os
import sys
import zipfile
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"

ZHVI_URL = (
    "https://files.zillowstatic.com/research/public_csvs/zhvi/"
    "Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
)
ZCTA_URL = "https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_zcta520_500k.zip"
COUNTY_URL = "https://www2.census.gov/geo/tiger/GENZ2020/shp/cb_2020_us_county_500k.zip"
REDFIN_URL = (
    "https://redfin-public-data.s3.us-west-2.amazonaws.com/"
    "redfin_market_tracker/zip_code_market_tracker.tsv000.gz"
)
# ACS 2023 5-year: total population, median household income, by ZCTA.
ACS_URL = (
    "https://api.census.gov/data/2023/acs/acs5"
    "?get=B01003_001E,B19013_001E&for=zip%20code%20tabulation%20area:*"
)

UA = {"User-Agent": "digital-land-research/1.0 (academic; contact: repo owner)"}


def fail(msg: str) -> None:
    sys.exit(f"DOWNLOAD FAILED: {msg}\nDo not guess an alternative URL. "
             "Find the current link on the provider's data page and confirm with Damian.")


def fetch(url: str, dest: Path, min_bytes: int) -> None:
    if dest.exists() and dest.stat().st_size >= min_bytes:
        print(f"skip (exists): {dest.name} ({dest.stat().st_size:,} bytes)")
        return
    print(f"downloading {url}")
    with requests.get(url, headers=UA, stream=True, timeout=300) as r:
        if r.status_code != 200:
            fail(f"{url} returned HTTP {r.status_code}")
        tmp = dest.with_suffix(dest.suffix + ".part")
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 20):
                f.write(chunk)
        if tmp.stat().st_size < min_bytes:
            fail(f"{dest.name}: only {tmp.stat().st_size:,} bytes (< {min_bytes:,}); truncated?")
        tmp.rename(dest)
    print(f"wrote {dest} ({dest.stat().st_size:,} bytes)")


def get_zhvi() -> None:
    dest = RAW / "zhvi_zip.csv"
    fetch(ZHVI_URL, dest, min_bytes=10_000_000)
    head = pd.read_csv(dest, nrows=5)
    for col in ("RegionName", "State"):
        assert col in head.columns, f"zhvi_zip.csv missing expected column {col!r}"
    ga = pd.read_csv(dest, usecols=["State"], dtype=str)
    n_ga = (ga["State"] == "GA").sum()
    assert n_ga > 400, f"only {n_ga} GA rows in ZHVI — expected ~700"
    print(f"ZHVI ok: {n_ga} GA ZIP rows")


def get_zcta() -> None:
    dest = RAW / "cb_2020_us_zcta520_500k.zip"
    fetch(ZCTA_URL, dest, min_bytes=50_000_000)
    outdir = RAW / "cb_2020_us_zcta520_500k"
    if not (outdir / "cb_2020_us_zcta520_500k.shp").exists():
        with zipfile.ZipFile(dest) as z:
            z.extractall(outdir)
        print(f"extracted ZCTA shapefile to {outdir}")


def get_county() -> None:
    dest = RAW / "cb_2020_us_county_500k.zip"
    fetch(COUNTY_URL, dest, min_bytes=2_000_000)
    outdir = RAW / "cb_2020_us_county_500k"
    if not (outdir / "cb_2020_us_county_500k.shp").exists():
        with zipfile.ZipFile(dest) as z:
            z.extractall(outdir)
        print(f"extracted county shapefile to {outdir}")


def get_acs() -> None:
    dest = RAW / "acs_zcta.csv"
    if dest.exists():
        print(f"skip (exists): {dest.name}")
        return
    key = os.environ.get("CENSUS_API_KEY")
    if not key:
        # Checked 2026-07-03: the Census API no longer serves keyless requests
        # (302 -> missing_key.html). A key is free and instant:
        print(
            "ACS SKIPPED — CENSUS_API_KEY is not set and the Census API now requires one.\n"
            "  TODO_VERIFY (Damian): sign up at https://api.census.gov/data/key_signup.html,\n"
            "  add `export CENSUS_API_KEY=...` to ~/.zshrc, then rerun `make download`.\n"
            "  build_panel.py will refuse to run until acs_zcta.csv exists."
        )
        return
    r = requests.get(ACS_URL + f"&key={key}", headers=UA, timeout=120, allow_redirects=False)
    if r.status_code != 200:
        fail(f"ACS API returned HTTP {r.status_code}: {r.text[:200]}")
    rows = r.json()
    df = pd.DataFrame(rows[1:], columns=rows[0]).rename(
        columns={
            "B01003_001E": "pop",
            "B19013_001E": "med_hh_inc",
            "zip code tabulation area": "zcta",
        }
    )
    df["pop"] = pd.to_numeric(df["pop"], errors="coerce")
    df["med_hh_inc"] = pd.to_numeric(df["med_hh_inc"], errors="coerce")
    # Census sentinel for suppressed medians
    df.loc[df["med_hh_inc"] < 0, "med_hh_inc"] = pd.NA
    assert len(df) > 30_000, f"only {len(df)} ZCTAs from ACS — expected ~33k"
    df.to_csv(dest, index=False)
    print(f"ACS ok: {len(df)} ZCTAs -> {dest}")


def get_redfin() -> None:
    dest = RAW / "redfin_zip.tsv.gz"
    fetch(REDFIN_URL, dest, min_bytes=100_000_000)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--redfin", action="store_true", help="also fetch the ~1GB Redfin tracker")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    RAW.mkdir(parents=True, exist_ok=True)
    if args.force:
        for name in ("zhvi_zip.csv", "acs_zcta.csv"):
            (RAW / name).unlink(missing_ok=True)
    get_zhvi()
    get_zcta()
    get_county()
    get_acs()
    if args.redfin:
        get_redfin()
    print("download_data: all done")


if __name__ == "__main__":
    main()
