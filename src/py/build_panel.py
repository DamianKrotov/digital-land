"""P2 — Build the ZIP-month estimation panel: data/processed/panel.parquet.

Inputs
  data/raw/events.csv                 hand-verified event dataset (Damian's file)
  data/processed/events_geocoded.csv  same rows + geocoded lat/lon (geocode_events.py)
  data/raw/zhvi_zip.csv               Zillow ZHVI, ZIP monthly smoothed SA
  data/raw/cb_2020_us_zcta520_500k/   ZCTA polygons (treatment + ring-1 adjacency)
  data/raw/cb_2020_us_county_500k/    county polygons (cluster variable)
  data/raw/acs_zcta.csv               ACS population + median HH income

HARD GUARDRAIL (CLAUDE.md #2): only rows with verified_by_human=TRUE enter the
panel. If none are verified, this script exits non-zero — there is deliberately
no override flag.

Treatment: ZCTA containing a verified site (stated ZIP if valid, else
point-in-polygon on lat/lon). g_mo = earliest announcement month per ZCTA.
Ring-1: ZCTAs touching a treated ZCTA; flagged and excluded from controls in
estimation (SUTVA hygiene, ARCHITECTURE §6).
"""

from __future__ import annotations

import sys
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw"
PROC = ROOT / "data" / "processed"

GA_ZIP_PREFIXES = ("30", "31", "398", "399")
PANEL_START = "2015-01"  # keep runway for pre-trends; assert coverage back to 2018-01


def month_index(dates: pd.Series) -> pd.Series:
    """Months since 2000-01 (mo=0). Integer time for did::att_gt."""
    d = pd.to_datetime(dates)
    return (d.dt.year - 2000) * 12 + (d.dt.month - 1)


def load_verified_events() -> pd.DataFrame:
    raw = pd.read_csv(RAW / "events.csv", dtype=str).fillna("")
    verified = raw[raw["verified_by_human"].str.strip().str.upper() == "TRUE"].copy()
    n_all, n_ok = len(raw), len(verified)
    print(f"events: {n_all} rows, {n_ok} verified_by_human=TRUE")
    if n_ok == 0:
        sys.exit(
            "REFUSING TO BUILD PANEL: 0 events have verified_by_human=TRUE.\n"
            "Open each source_url in data/raw/events.csv, confirm company/place/date,\n"
            "flip the flag, and rerun. (Hard guardrail #2 — no override.)"
        )
    geo = PROC / "events_geocoded.csv"
    if geo.exists():
        g = pd.read_csv(geo, dtype=str).fillna("")[["event_id", "lat", "lon"]]
        verified = verified.drop(columns=["lat", "lon"]).merge(g, on="event_id", how="left")
    bad_dates = verified[~verified["announce_date"].str.match(r"\d{4}-\d{2}-\d{2}")]
    assert bad_dates.empty, f"verified rows with unparseable announce_date: {bad_dates['event_id'].tolist()}"
    return verified


def ga_zcta_polygons() -> gpd.GeoDataFrame:
    shp = RAW / "cb_2020_us_zcta520_500k" / "cb_2020_us_zcta520_500k.shp"
    z = gpd.read_file(shp)[["ZCTA5CE20", "geometry"]].rename(columns={"ZCTA5CE20": "zcta"})
    z = z[z["zcta"].str.startswith(GA_ZIP_PREFIXES)].reset_index(drop=True)
    assert 600 < len(z) < 900, f"{len(z)} GA ZCTAs — expected ~700"
    return z


def assign_event_zctas(events: pd.DataFrame, zctas: gpd.GeoDataFrame) -> pd.DataFrame:
    """Map each verified event to a ZCTA: stated ZIP if valid, else lat/lon join."""
    universe = set(zctas["zcta"])
    out = []
    for _, e in events.iterrows():
        zip5 = str(e["zip"]).strip()
        if zip5 in universe:
            out.append((e["event_id"], zip5, "stated_zip"))
            continue
        if e["lat"] and e["lon"]:
            pt = gpd.GeoDataFrame(
                geometry=gpd.points_from_xy([float(e["lon"])], [float(e["lat"])]),
                crs="EPSG:4326",
            ).to_crs(zctas.crs)
            hit = gpd.sjoin(pt, zctas, predicate="within")
            if len(hit):
                out.append((e["event_id"], hit.iloc[0]["zcta"], "point_in_polygon"))
                continue
        out.append((e["event_id"], "", "UNMATCHED"))
    m = pd.DataFrame(out, columns=["event_id", "zcta", "match_method"])
    misses = m[m["zcta"] == ""]
    if len(misses):
        print("UNMATCHED events (no valid zip, no usable lat/lon):",
              misses["event_id"].tolist())
    return m


def main() -> None:
    events = load_verified_events()
    zctas = ga_zcta_polygons()

    acs_path = RAW / "acs_zcta.csv"
    if not acs_path.exists():
        sys.exit(
            "REFUSING TO BUILD PANEL: data/raw/acs_zcta.csv missing.\n"
            "Covariates (log_pop, log_inc) are part of the pre-registered spec.\n"
            "Set CENSUS_API_KEY (api.census.gov/data/key_signup.html) and run `make download`."
        )

    # --- outcome: ZHVI long ---
    zhvi = pd.read_csv(RAW / "zhvi_zip.csv", dtype={"RegionName": str})
    zhvi = zhvi[zhvi["State"] == "GA"]
    date_cols = [c for c in zhvi.columns if c[:2] in ("19", "20")]
    long = zhvi.melt(
        id_vars=["RegionName"], value_vars=date_cols, var_name="date", value_name="zhvi"
    ).rename(columns={"RegionName": "zip"})
    long["date"] = pd.to_datetime(long["date"])
    long = long[long["date"] >= PANEL_START].dropna(subset=["zhvi"])
    long["mo"] = month_index(long["date"])
    long["log_zhvi"] = np.log(long["zhvi"])

    # --- treatment assignment ---
    matched = assign_event_zctas(events, zctas)
    zhvi_zips = set(long["zip"])
    matched["in_zhvi"] = matched["zcta"].isin(zhvi_zips)
    match_rate = matched["in_zhvi"].mean()
    print(f"event->ZHVI match: {matched['in_zhvi'].sum()}/{len(matched)} ({match_rate:.0%})")
    for _, r in matched[~matched["in_zhvi"]].iterrows():
        print(f"  MISS {r['event_id']}: zcta={r['zcta'] or 'none'} ({r['match_method']})")
    assert match_rate >= 0.90, "under 90% of verified events matched to a ZHVI ZIP (P2 acceptance)"

    ev = events.merge(matched[matched["in_zhvi"]][["event_id", "zcta"]], on="event_id")
    ev["g_mo"] = month_index(ev["announce_date"])
    g_by_zip = ev.groupby("zcta")["g_mo"].min().rename("g_mo").reset_index()
    # event->zip map for LOO robustness (investment-ranked) in 04_robustness.R
    ev["investment_usd_m"] = pd.to_numeric(ev["investment_usd_m"], errors="coerce").fillna(0)
    PROC.mkdir(parents=True, exist_ok=True)
    ev[["event_id", "zcta", "g_mo", "investment_usd_m", "company"]].to_csv(
        PROC / "event_zip_map.csv", index=False
    )

    # --- ring-1 adjacency (treated ZCTAs' neighbors, SUTVA exclusion) ---
    treated_geo = zctas[zctas["zcta"].isin(g_by_zip["zcta"])]
    ring = gpd.sjoin(zctas, treated_geo, predicate="touches")
    ring1 = set(ring["zcta_left"]) - set(g_by_zip["zcta"])
    print(f"treated ZCTAs: {len(g_by_zip)}; ring-1 neighbors: {len(ring1)}")

    # --- county for cluster-robustness (county containing ZCTA centroid) ---
    counties = gpd.read_file(RAW / "cb_2020_us_county_500k" / "cb_2020_us_county_500k.shp")
    counties = counties[counties["STATEFP"] == "13"][["NAME", "geometry"]].rename(
        columns={"NAME": "county"}
    )
    cent = zctas.copy()
    cent["geometry"] = cent.geometry.representative_point()
    zcta_county = gpd.sjoin(cent, counties.to_crs(zctas.crs), predicate="within")[
        ["zcta", "county"]
    ]

    # --- covariates ---
    acs = pd.read_csv(acs_path, dtype={"zcta": str})
    acs["log_pop"] = np.log(acs["pop"].clip(lower=1))
    acs["log_inc"] = np.log(acs["med_hh_inc"])

    # --- assemble ---
    panel = (
        long.merge(g_by_zip, left_on="zip", right_on="zcta", how="left")
        .drop(columns=["zcta"])
        .merge(zcta_county, left_on="zip", right_on="zcta", how="left")
        .drop(columns=["zcta"])
        .merge(acs[["zcta", "log_pop", "log_inc"]], left_on="zip", right_on="zcta", how="left")
        .drop(columns=["zcta"])
    )
    panel["g_mo"] = panel["g_mo"].fillna(0).astype(int)  # 0 = never treated (did convention)
    panel["treated"] = (panel["g_mo"] > 0).astype(int)
    panel["ring1"] = panel["zip"].isin(ring1)
    panel["zip_id"] = panel["zip"].astype("category").cat.codes.astype(int)

    n_cov_miss = panel[panel["treated"] == 1]["log_inc"].isna().sum()
    dropped = panel["log_inc"].isna() | panel["log_pop"].isna()
    print(f"dropping {panel[dropped]['zip'].nunique()} ZIPs with missing ACS covariates "
          f"({n_cov_miss} treated zip-months affected)")
    panel = panel[~dropped]

    # --- asserts (P2 acceptance) ---
    assert not panel.duplicated(["zip", "mo"]).any(), "duplicate zip-month rows"
    assert panel["date"].min() <= pd.Timestamp("2018-01-01"), "panel does not span back to 2018-01"
    n_treated = panel[panel["treated"] == 1]["zip"].nunique()
    assert n_treated >= 1, "no treated ZIPs survived assembly"
    pre_months = (
        panel[panel["treated"] == 1].groupby("zip")
        .apply(lambda d: (d["g_mo"].iloc[0] - d["mo"].min()), include_groups=False)
    )
    assert (pre_months >= 12).all(), f"treated ZIPs with <12 pre-months: {pre_months[pre_months < 12].index.tolist()}"

    PROC.mkdir(parents=True, exist_ok=True)
    out = PROC / "panel.parquet"
    panel.drop(columns=["date"]).to_parquet(out, index=False)
    print(
        f"panel ok -> {out}\n"
        f"  {panel['zip'].nunique()} ZIPs x months {panel['mo'].min()}..{panel['mo'].max()} "
        f"({len(panel):,} rows)\n"
        f"  treated: {n_treated} ZIPs | ring1 flagged: {panel[panel['ring1']]['zip'].nunique()} "
        f"| controls: {panel[(panel['treated']==0) & (~panel['ring1'])]['zip'].nunique()}"
    )


if __name__ == "__main__":
    main()
