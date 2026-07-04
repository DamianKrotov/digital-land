"""Geocode event sites that lack lat/lon. Writes data/processed/events_geocoded.csv.

Never edits data/raw/events.csv (that file is Damian's hand-verified record).
Strategy, per CLAUDE.md: Census geocoder for street addresses (parsed from an
`addr:` hint in notes), Nominatim for city/county descriptions. Every result is
cached in data/processed/geocode_cache.json so reruns are deterministic and
offline. The geocode method + query used are recorded per row.

Rows whose city AND notes give nothing to geocode are left blank and listed at
the end — those need a human (or a better source) anyway.
"""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[2]
EVENTS = ROOT / "data" / "raw" / "events.csv"
OUT = ROOT / "data" / "processed" / "events_geocoded.csv"
CACHE_PATH = ROOT / "data" / "processed" / "geocode_cache.json"

CENSUS_URL = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
UA = {"User-Agent": "digital-land-research/1.0 (academic event-study; one-off geocoding)"}


def load_cache() -> dict:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text())
    return {}


def save_cache(cache: dict) -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, indent=1, sort_keys=True))


def census_onelineaddress(addr: str, cache: dict) -> tuple[float, float] | None:
    key = f"census|{addr}"
    if key in cache:
        v = cache[key]
        return (v[0], v[1]) if v else None
    r = requests.get(
        CENSUS_URL,
        params={"address": addr, "benchmark": "Public_AR_Current", "format": "json"},
        headers=UA, timeout=30,
    )
    r.raise_for_status()
    matches = r.json().get("result", {}).get("addressMatches", [])
    val = None
    if matches:
        c = matches[0]["coordinates"]
        val = (float(c["y"]), float(c["x"]))
    cache[key] = val
    return val


def nominatim(query: str, cache: dict) -> tuple[float, float] | None:
    key = f"nominatim|{query}"
    if key in cache:
        v = cache[key]
        return (v[0], v[1]) if v else None
    time.sleep(1.1)  # usage policy: max 1 req/s
    r = requests.get(
        NOMINATIM_URL,
        params={"q": query, "format": "json", "limit": 1, "countrycodes": "us"},
        headers=UA, timeout=30,
    )
    r.raise_for_status()
    hits = r.json()
    val = (float(hits[0]["lat"]), float(hits[0]["lon"])) if hits else None
    cache[key] = val
    return val


def addr_hint(notes: str) -> str | None:
    """Optional convention: put `addr: 123 Road Rd, City GA` inside notes."""
    m = re.search(r"addr:\s*([^;|]+)", str(notes))
    return m.group(1).strip() if m else None


def main() -> None:
    df = pd.read_csv(EVENTS, dtype=str).fillna("")
    cache = load_cache()
    methods, queries = [], []
    unresolved = []

    for _, row in df.iterrows():
        if row["lat"] and row["lon"]:
            methods.append("source_stated")
            queries.append("")
            continue
        hint = addr_hint(row["notes"])
        latlon, method, query = None, "", ""
        if hint:
            query = f"{hint}" if "GA" in hint.upper() else f"{hint}, GA"
            latlon = census_onelineaddress(query, cache)
            method = "census_onelineaddress"
        if latlon is None:
            city = row["city"] if row["city"] not in ("", "TODO_VERIFY") else ""
            county = row["county"] if row["county"] not in ("", "TODO_VERIFY") else ""
            if city or county:
                parts = [p for p in (city, f"{county} County" if county else "", "Georgia, USA") if p]
                query = ", ".join(parts)
                latlon = nominatim(query, cache)
                method = "nominatim_place"
        if latlon is None:
            unresolved.append(row["event_id"])
            methods.append("UNRESOLVED")
            queries.append(query)
        else:
            df.loc[row.name, "lat"] = f"{latlon[0]:.5f}"
            df.loc[row.name, "lon"] = f"{latlon[1]:.5f}"
            methods.append(method)
            queries.append(query)

    save_cache(cache)
    df["geocode_method"] = methods
    df["geocode_query"] = queries
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)

    n_ok = (df["geocode_method"] != "UNRESOLVED").sum()
    print(f"geocoded {n_ok}/{len(df)} rows -> {OUT}")
    if unresolved:
        print("UNRESOLVED (need city/county or addr: hint in notes):", ", ".join(unresolved))
    # sanity: every resolved point must fall in a Georgia-ish bounding box
    ok = df[df["lat"] != ""]
    lats = ok["lat"].astype(float)
    lons = ok["lon"].astype(float)
    bad = ok[(lats < 30.3) | (lats > 35.1) | (lons < -85.7) | (lons > -80.7)]
    assert bad.empty, f"points outside Georgia bbox: {bad['event_id'].tolist()}"
    print("bbox assert ok: all resolved points inside Georgia")


if __name__ == "__main__":
    main()
