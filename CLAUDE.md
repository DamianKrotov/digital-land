# CLAUDE.md — Digital Land (GA data centers → property values)

Research repo producing: (1) short working paper, (2) HGSSS essay, (3) HGSSS video.
Deadline: **14 days from 2026-07-03**. Owner: Damian (he verifies; you build).
Read `docs/ARCHITECTURE.md` before any phase. Work in **plan mode** first for each phase; use extended thinking for Phase 3.

## Hard guardrails (never violate)

1. **Never fabricate data, dates, coordinates, statistics, or citations.** If a value is unknown, write `TODO_VERIFY` and stop to ask.
2. Every row in `data/raw/events.csv` must carry ≥1 working `source_url`. Rows with `verified_by_human=FALSE` are **excluded** from analysis by the pipeline — enforce in code.
3. If a download URL 404s, do not guess an alternative silently — search the provider's data page, then confirm the new URL with Damian.
4. Deterministic everything: set seeds (`set.seed(51)` / `np.random.default_rng(51)`); pin package versions in `renv`/`uv.lock`.
5. Sanity asserts in every pipeline step (see Phase acceptance). A step without asserts is unfinished.
6. Append a one-line summary of every session's prompts to `PROMPTS_LOG.md` (contest requires AI disclosure).
7. No author-identifying info in any deliverable artifact (paper is fine; essay/video are not). Only self-generated figures; no copyrighted music/footage.
8. Prefer boring, readable code over clever code. Functions + docstrings; no notebooks in `src/`.

## Environment setup (macOS, run once — Phase 0)

```bash
# Homebrew, then:
brew install git quarto ffmpeg node r uv
# Claude Code: use the native installer per https://code.claude.com/docs (npm install is deprecated).
uv init --python 3.12 && uv add pandas numpy geopandas pyarrow requests matplotlib lightgbm jupyter
# R packages (run in R):
# install.packages(c("tidyverse","did","fixest","sf","tigris","tidycensus","modelsummary","fwildclusterboot","renv"))
# remotes::install_github("asheshrambachan/HonestDiD")   # stretch goal only
# Census key: https://api.census.gov/data/key_signup.html → export CENSUS_API_KEY=... in ~/.zshrc
# Remotion (Phase 6): npx create-video@latest   # free for individuals; docs: remotion.dev/docs/ai/claude-code
git init && gh repo create digital-land --private   # GitHub Education account
```

## Repo layout

```
digital-land/
  docs/ARCHITECTURE.md        # the plan (source of truth)
  refs/sources.md             # every external number → URL + accessed date; PDFs alongside
  data/raw/events.csv         # hand-verified event dataset (schema below)
  data/raw/zhvi_zip.csv       # Zillow download (do not edit)
  data/raw/redfin_zip.tsv.gz  # Redfin download (do not edit)
  data/processed/panel.parquet
  src/py/                     # ETL, geocoding, Monte Carlo
  src/r/                      # estimation, figures, tables
  output/results.json         # single source of truth for all reported numbers
  output/figs/                # pdf+png, and .json data behind each fig for Remotion
  paper/paper.qmd             # working paper (Quarto)
  essay/essay.qmd             # contest essay (anonymized)
  video/                      # Remotion project
  PROMPTS_LOG.md
```

## Data sources

- **Zillow ZHVI** (ZIP, monthly, smoothed SA, all homes). Known URL (verify before trusting):
  `https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`
  Fallback: get current link from zillow.com/research/data (ZHVI → ZIP geography).
- **Redfin ZIP market tracker** (robustness outcome): from Redfin Data Center; large gz TSV
  (`redfin_market_tracker/zip_code_market_tracker.tsv000.gz` on their S3). Filter to `state_code == "GA"` on read.
- **Geometry/covariates:** `tigris::zctas()` (cache with `options(tigris_use_cache=TRUE)`), `tidycensus::get_acs()` ZCTA population + median HH income (2023 5-yr).
- **Events:** built by hand+Claude from GA Dept. of Economic Development / Governor pressers, county development-authority minutes, AJC/ABC/Data Center Frontier, datacentermap.com + baxtel.com for discovery. Completeness cross-check: GA DOAA audit counts (63 active / 35 UC / 249 announced, Dec 2025).
- **Policy PDFs for /refs:** GA PSC Data Center Fact Sheet (psc.ga.gov, Mar 2026); PSC 2025 certification stipulation; DOAA audit summary; E3 "Forecasting Large Loads" (Dec 2025).

## events.csv schema

`event_id, company, facility_name, city, county, state, zip, lat, lon, announce_date (YYYY-MM-DD), announce_precision (day|month), investment_usd_m, capacity_mw, acreage, status_2026 (announced|under_construction|operational|delayed|withdrawn), source_url_1, source_url_2, verified_by_human (TRUE|FALSE), notes`

Rules: `announce_date` = earliest credible public report; geocode from street address or site description (Census geocoder / Nominatim; record method in notes); one row per campus (expansions of same campus = new row only if separately announced with new date).

## Phases and acceptance criteria

**P0 — Scaffold (30 min).** Repo layout above; `refs/sources.md` seeded from ARCHITECTURE §2/§4; Makefile or `run.md` with the exact command order. ✓ `quarto render` works on a stub.

**P1 — Events (Claude drafts, Damian verifies; target ≥40 rows).** Use web search to enumerate GA announcements 2019–2026; fill schema; set `verified_by_human=FALSE`. Produce `output/events_qc.html`: map of sites, timeline histogram, dupes check, missing-date list. ✓ QC report renders; Damian flips rows TRUE; pipeline drops FALSE rows.

**P2 — Panel (Python).** Merge ZHVI (long format) × GA ZIP universe × ACS covariates × treatment assignment (ZIP contains site → treated; first-ring adjacent ZIPs → `ring1=TRUE`, excluded from controls). Asserts: no duplicate zip-month; ≥90% of verified events matched to a ZHVI ZIP (log the misses); panel spans ≥2018-01. ✓ `data/processed/panel.parquet` + printed assert summary.

**P3 — Estimation (R, extended thinking).** `did::att_gt(yname="log_zhvi", tname="mo", idname="zip_id", gname="g_mo", xformla=~log_pop+log_inc, control_group="notyettreated", est_method="dr", anticipation=3, clustervars="zip_id")` → `aggte(dynamic, min_e=-24, max_e=36)` and `aggte(simple)`. Save model objects (`.rds`), write headline numbers to `output/results.json`, render event-study figure (also dump plotted points to `output/figs/eventstudy.json` for Remotion). ✓ Pre-trend window plotted; results.json exists; no number reported anywhere except from results.json.

**P4 — Robustness.** (a) never-treated controls; (b) `fixest::sunab`; (c) Redfin outcome; (d) drop 2020-01–2021-12; (e) anticipation ∈ {0,6}; (f) permutation placebo (999 draws) on announce dates; (g) leave-one-out top-3 projects; (h) lightgbm propensity trimming of controls (report overlap plot). One `modelsummary` table. ✓ table renders in paper; placebo p-value reported.

**P5 — Monte Carlo sidebar (Python, small).** Stranded cost = 9,985 MW × (1−p) × capex$/kW; p ~ Beta calibrated to scenarios {0.8, 0.5, 0.22}; capex range per EIA CCGT (cite in refs). Fan chart titled "ILLUSTRATIVE". ✓ figure + params echoed into results.json.

**P6 — Paper → essay → video.** `paper/paper.qmd` (~8–10 pp: intro, background+George, data, methods, results, discussion, limitations). Then `essay/essay.qmd` = compressed, anonymized. Then Remotion: scenes read `output/figs/*.json`; structure per ARCHITECTURE §12; Damian records VO; target 4–6 min unless official rules say otherwise (check `refs/rules.md`). ✓ paper builds from clean clone; essay greps clean for identity; MP4 renders with synced VO.

## Subagents (define in .claude/agents/)

- **data-engineer:** owns P1–P2; obsessive about asserts and provenance.
- **econometrician-reviewer:** adversarial pass on P3–P4; checks estimator usage against Callaway–Sant'Anna docs, hunts for hand-typed numbers, verifies every paper claim traces to results.json or refs/.
- **video-producer:** owns P6 Remotion; keeps scenes data-driven; flags any asset with unclear license.

## Session etiquette

Start each session: read this file + `docs/ARCHITECTURE.md`, state the phase, propose a plan, wait for approval. End each session: update `PROMPTS_LOG.md`, commit with a descriptive message, list open `TODO_VERIFY` items for Damian.
