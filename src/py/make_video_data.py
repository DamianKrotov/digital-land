"""P6 — bake video/src/data/video_data.json for the Remotion film.

One deterministic artifact carrying everything the scenes may show:
GA county geometry as SVG paths, the 48 verified announcement dots, the
event-study path, the stranded-cost fan, headline stats, and the
sources.md-traceable facts from refs/video_facts.json.

Gate (mirrors refs/mc_params.json): refs/video_facts.json carries
"verified": false until Damian checks each value against its source row.
The baker embeds that flag; the composition renders an animatic with a
DRAFT badge while false and REFUSES a final-mode render until true.

Determinism: sorted keys, fixed rounding, no timestamps — running twice
must produce byte-identical output (qc_video.py enforces).
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
COUNTY_SHP = ROOT / "data/raw/cb_2020_us_county_500k/cb_2020_us_county_500k.shp"
EVENTS = ROOT / "data/processed/events_geocoded.csv"
EVENTSTUDY = ROOT / "output/figs/eventstudy.json"
FAN = ROOT / "output/figs/stranded_fan.json"
RESULTS = ROOT / "output/results.json"
FACTS = ROOT / "refs/video_facts.json"
OUT = ROOT / "video/src/data/video_data.json"

ALBERS = "EPSG:5070"  # CONUS Albers equal-area; GA straddles UTM 16/17
SIMPLIFY_M = 500      # meters; 500k cartographic file stays crisp at 1080p
TARGET = 1000.0       # long-edge of the SVG viewBox


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def ring_to_path(coords, tx) -> str:
    pts = [tx(x, y) for x, y in coords]
    body = " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    return f"M {body} Z"


def geom_to_path(geom, tx) -> str:
    polys = geom.geoms if geom.geom_type == "MultiPolygon" else [geom]
    rings = []
    for p in polys:
        rings.append(ring_to_path(p.exterior.coords, tx))
        rings.extend(ring_to_path(r.coords, tx) for r in p.interiors)
    return " ".join(rings)


def lines_to_path(geom, tx) -> str:
    lines = geom.geoms if geom.geom_type.startswith("Multi") else [geom]
    parts = []
    for line in lines:
        pts = [tx(x, y) for x, y in line.coords]
        body = " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts)
        parts.append(f"M {body}")
    return " ".join(parts)


def main() -> None:
    facts_raw = json.loads(FACTS.read_text())
    facts_verified = facts_raw.get("verified") is True
    if not facts_verified:
        print("NOTE: refs/video_facts.json verified=false -> baking DRAFT data "
              "(animatic renders with a DRAFT badge; final render will refuse).")

    # --- counties -> SVG paths ---
    counties = gpd.read_file(COUNTY_SHP)
    ga = counties[counties["STATEFP"] == "13"][["GEOID", "NAME", "geometry"]].copy()
    assert len(ga) == 159, f"expected 159 GA counties, got {len(ga)}"
    try:
        ga.geometry = ga.geometry.make_valid()
    except AttributeError:  # older geopandas
        ga.geometry = ga.geometry.buffer(0)
    ga = ga.to_crs(ALBERS)
    ga.geometry = ga.geometry.simplify(SIMPLIFY_M, preserve_topology=True)

    minx, miny, maxx, maxy = ga.total_bounds
    s = TARGET / max(maxx - minx, maxy - miny)
    w = round((maxx - minx) * s, 1)
    h = round((maxy - miny) * s, 1)

    def tx(x: float, y: float) -> tuple[float, float]:
        return ((x - minx) * s, (maxy - y) * s)  # y-flip for SVG

    ga = ga.sort_values("GEOID")
    county_paths = [
        {"geoid": r.GEOID, "name": r.NAME, "d": geom_to_path(r.geometry, tx)}
        for r in ga.itertuples()
    ]
    assert all(c["d"] for c in county_paths), "empty county path"
    for c in county_paths:
        for mx, my in re.findall(r"([\d.]+) ([\d.]+)", c["d"]):
            assert -1 <= float(mx) <= w + 1 and -1 <= float(my) <= h + 1, \
                f"county {c['geoid']} coord outside viewBox"
    outline = lines_to_path(unary_union(list(ga.geometry)).boundary, tx)

    # --- events -> dots (verified rows only; same filter as the panel) ---
    ev = pd.read_csv(EVENTS, dtype=str).fillna("")
    ok = (
        (ev["verified_by_human"].str.strip().str.upper() == "TRUE")
        & (ev["lat"] != "") & (ev["lon"] != "")
        & ev["announce_date"].str.match(r"^\d{4}-\d{2}-\d{2}$")
    )
    ev = ev[ok].copy()
    pts = gpd.GeoDataFrame(
        ev, geometry=gpd.points_from_xy(ev["lon"].astype(float), ev["lat"].astype(float)),
        crs="EPSG:4326",
    ).to_crs(ALBERS)
    events = []
    for r in pts.itertuples():
        x, y = tx(r.geometry.x, r.geometry.y)
        assert 0 <= x <= w and 0 <= y <= h, f"event {r.event_id} outside viewBox"
        inv = r.investment_usd_m
        events.append({
            "id": r.event_id,
            "x": round(x, 1), "y": round(y, 1),
            "date": r.announce_date,
            "company": r.company,
            "county": r.county,
            "investment_usd_m": float(inv) if inv else None,
            "status": r.status_2026,
        })
    events.sort(key=lambda e: (e["date"], e["id"]))
    assert len(events) >= 40, f"only {len(events)} render-ready events (target >=40)"
    assert {e["status"] for e in events} <= {"announced", "under_construction", "operational", "withdrawn"}
    n_inv = sum(1 for e in events if e["investment_usd_m"])

    # --- passthroughs ---
    es = json.loads(EVENTSTUDY.read_text())
    assert len(es) == 61 and es[0]["e"] == -24 and es[-1]["e"] == 36, "eventstudy shape changed"
    assert {p["phase"] for p in es} <= {"pre", "post"}
    fan = json.loads(FAN.read_text())
    for scen, q in fan.items():
        assert (q["stranded_bn_p5"] <= q["stranded_bn_p25"] <= q["stranded_bn_median"]
                <= q["stranded_bn_p75"] <= q["stranded_bn_p95"]), f"non-monotone fan: {scen}"
    results = json.loads(RESULTS.read_text())
    main_r = results["main"]
    assert main_r["n_treated_zips"] == 31, "treated-ZIP count changed — rebake after checking script text"
    headline = {
        "att_pct": round(100 * main_r["att_simple"], 2),
        "ci_lo_pct": round(100 * main_r["ci_lo"], 2),
        "ci_hi_pct": round(100 * main_r["ci_hi"], 2),
        "n_treated_zips": main_r["n_treated_zips"],
        "n_control_zips": main_r["n_control_zips"],
        "pretrend_n": main_r["pretrend_n"],
        "pretrend_n_sig_5pct": main_r["pretrend_n_sig_5pct"],
        "placebo_p": round(results["robustness"]["placebo"]["p_value"], 3),
        "placebo_B": results["robustness"]["placebo"]["B"],
        "robustness_specs": [
            {"label": k, "att_pct": round(100 * v["att"][0] if isinstance(v["att"], list) else 100 * v["att"], 2)}
            for k, v in results["robustness"].items() if k != "placebo"
        ],
    }
    facts = {k: v for k, v in facts_raw["facts"].items()}
    assert facts["psc_mw_certified"]["value"] == results["monte_carlo"]["params"]["mw_certified"], \
        "video_facts MW disagrees with mc_params"

    out = {
        "meta": {
            "inputs": {
                "events_csv_sha256": sha256(EVENTS),
                "results_json_sha256": sha256(RESULTS),
                "county_shp_sha256": sha256(COUNTY_SHP),
            },
            "n_events": len(events),
            "n_events_with_investment": n_inv,
            "facts_verified": facts_verified,
        },
        "map": {"viewBox": {"w": w, "h": h}, "counties": county_paths, "stateOutline": outline},
        "events": events,
        "eventstudy": es,
        "fan": fan,
        "headline": headline,
        "facts": facts,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, sort_keys=True, indent=1))
    print(
        f"video data ok -> {OUT} ({OUT.stat().st_size/1024:.0f} KB)\n"
        f"  counties: {len(county_paths)} | viewBox {w}x{h} | events: {len(events)} "
        f"({n_inv} with investment) | eventstudy pts: {len(es)} | facts_verified: {facts_verified}"
    )


if __name__ == "__main__":
    main()
