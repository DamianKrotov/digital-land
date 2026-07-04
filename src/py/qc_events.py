"""P1 QC — render output/events_qc.html for Damian's verification pass.

Runs on UNVERIFIED rows by design: its whole purpose is to make the human
check fast. Shows a site map, announcement timeline, duplicate suspects,
missing-field lists, and one row per event with clickable source links.
"""

from __future__ import annotations

import base64
import html
import io
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import geopandas as gpd
import matplotlib.pyplot as plt
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
EVENTS = ROOT / "data" / "raw" / "events.csv"
GEOCODED = ROOT / "data" / "processed" / "events_geocoded.csv"
OUT = ROOT / "output" / "events_qc.html"


def fig_to_b64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=140, bbox_inches="tight")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()


def site_map(df: pd.DataFrame) -> str:
    counties = gpd.read_file(
        ROOT / "data/raw/cb_2020_us_county_500k/cb_2020_us_county_500k.shp"
    )
    ga = counties[counties["STATEFP"] == "13"]
    fig, ax = plt.subplots(figsize=(7, 7))
    ga.boundary.plot(ax=ax, linewidth=0.4, color="#999")
    pts = df[(df["lat"] != "") & (df["lon"] != "")]
    if len(pts):
        ax.scatter(
            pts["lon"].astype(float), pts["lat"].astype(float),
            s=40, c="crimson", edgecolors="black", linewidths=0.5, zorder=5,
        )
        for _, r in pts.iterrows():
            ax.annotate(r["event_id"], (float(r["lon"]), float(r["lat"])),
                        fontsize=6, xytext=(3, 3), textcoords="offset points")
    ax.set_title(f"Announced data-center sites with coordinates (n={len(pts)}/{len(df)})")
    ax.set_axis_off()
    return fig_to_b64(fig)


def timeline(df: pd.DataFrame) -> str:
    d = pd.to_datetime(df["announce_date"], errors="coerce").dropna()
    fig, ax = plt.subplots(figsize=(8, 3))
    if len(d):
        d.groupby(d.dt.to_period("Q")).size().plot(kind="bar", ax=ax, color="#33f")
        ax.set_title(f"Announcements per quarter (n={len(d)} dated / {len(df)} total)")
        ax.tick_params(axis="x", labelsize=7)
    return fig_to_b64(fig)


def dupe_suspects(df: pd.DataFrame) -> pd.DataFrame:
    """Same company + county announced within 120 days = possible duplicate."""
    d = df.copy()
    d["dt"] = pd.to_datetime(d["announce_date"], errors="coerce")
    sus = []
    for (comp, cty), grp in d.groupby(["company", "county"]):
        if len(grp) < 2:
            continue
        grp = grp.sort_values("dt")
        for a, b in zip(grp.index[:-1], grp.index[1:]):
            gap = (grp.loc[b, "dt"] - grp.loc[a, "dt"]).days if pd.notna(grp.loc[a, "dt"]) and pd.notna(grp.loc[b, "dt"]) else None
            if gap is None or gap <= 120:
                sus.append({
                    "company": comp, "county": cty,
                    "event_a": grp.loc[a, "event_id"], "event_b": grp.loc[b, "event_id"],
                    "days_apart": gap if gap is not None else "undated",
                })
    return pd.DataFrame(sus)


def events_table(df: pd.DataFrame) -> str:
    rows = []
    for _, r in df.iterrows():
        links = []
        for col in ("source_url_1", "source_url_2"):
            u = str(r[col]).strip()
            if u and u != "TODO_VERIFY":
                links.append(f'<a href="{html.escape(u)}" target="_blank">{col[-1]}</a>')
        todo = sum(str(v).strip() == "TODO_VERIFY" for v in r)
        style = ' style="background:#fff3cd"' if r["verified_by_human"].upper() != "TRUE" else ""
        rows.append(
            f"<tr{style}><td>{html.escape(r['event_id'])}</td>"
            f"<td>{html.escape(r['company'])}</td>"
            f"<td>{html.escape(r['facility_name'])}</td>"
            f"<td>{html.escape(r['city'])} / {html.escape(r['county'])}</td>"
            f"<td>{html.escape(r['announce_date'])} ({html.escape(r['announce_precision'])})</td>"
            f"<td>{html.escape(r['investment_usd_m'])}</td>"
            f"<td>{html.escape(r['status_2026'])}</td>"
            f"<td>{' '.join(links) or '<b>NONE</b>'}</td>"
            f"<td>{todo or ''}</td>"
            f"<td>{html.escape(r['verified_by_human'])}</td>"
            f"<td class=notes>{html.escape(r['notes'])}</td></tr>"
        )
    return (
        "<table><tr><th>id</th><th>company</th><th>facility</th><th>city/county</th>"
        "<th>announced</th><th>$M</th><th>status</th><th>sources</th><th>#TODO</th>"
        "<th>verified</th><th>notes</th></tr>" + "\n".join(rows) + "</table>"
    )


def main() -> None:
    src = GEOCODED if GEOCODED.exists() else EVENTS
    df = pd.read_csv(src, dtype=str).fillna("")
    n = len(df)
    dated = pd.to_datetime(df["announce_date"], errors="coerce").notna().sum()
    verified = (df["verified_by_human"].str.upper() == "TRUE").sum()
    missing_date = df[pd.to_datetime(df["announce_date"], errors="coerce").isna()]["event_id"].tolist()
    missing_src = df[df["source_url_1"].isin(("", "TODO_VERIFY"))]["event_id"].tolist()
    dupes = dupe_suspects(df)

    by_status = df["status_2026"].value_counts().to_frame("n").to_html()
    dupes_html = dupes.to_html(index=False) if len(dupes) else "<p>none detected</p>"

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(f"""<!doctype html><meta charset="utf-8">
<title>events QC — digital-land</title>
<style>
 body {{ font: 14px -apple-system, sans-serif; margin: 2em; max-width: 1250px; }}
 table {{ border-collapse: collapse; font-size: 12px; }}
 td, th {{ border: 1px solid #ccc; padding: 3px 6px; text-align: left; vertical-align: top; }}
 .notes {{ max-width: 340px; }}
 .big {{ font-size: 20px; font-weight: 700; }}
</style>
<h1>Event dataset QC — {pd.Timestamp.now():%Y-%m-%d %H:%M}</h1>
<p class=big>{n} events · {dated} dated · {verified} verified by human · target ≥40 verified</p>
<h2>Verification protocol (ARCHITECTURE §9)</h2>
<ol>
 <li>Open each source link; confirm <b>company, place, announcement date</b> match the row.</li>
 <li>Fix anything wrong <b>in data/raw/events.csv</b>, then set verified_by_human=TRUE.</li>
 <li>Rows left FALSE are excluded from the panel automatically.</li>
</ol>
<h2>Map</h2><img src="data:image/png;base64,{site_map(df)}">
<h2>Timeline</h2><img src="data:image/png;base64,{timeline(df)}">
<h2>Status mix</h2>{by_status}
<h2>Duplicate suspects (same company+county ≤120 days or undated)</h2>{dupes_html}
<h2>Missing announce_date ({len(missing_date)})</h2><p>{', '.join(missing_date) or 'none'}</p>
<h2>Missing source_url_1 ({len(missing_src)})</h2><p>{', '.join(missing_src) or 'none'}</p>
<h2>All events (yellow = unverified)</h2>
{events_table(df)}
""")
    print(f"QC report -> {OUT}  ({n} events, {verified} verified, {len(dupes)} dupe suspects)")


if __name__ == "__main__":
    main()
