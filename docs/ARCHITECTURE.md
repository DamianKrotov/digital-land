# Digital Land: Data Center Announcements and the Capture of Community-Created Value in Georgia
### Research architecture — v1.0 (July 3, 2026 · 14 days to deadline)

**One-line thesis.** Data centers convert public assets — grid capacity, water, tax revenue, and locational value created by the community — into private returns; this project measures one channel of that conversion (the capitalization of announcements into Georgia residential land/home values, 2019–2026) and documents the others (tax exemptions, ratepayer risk), interpreted through Henry George's theory of rent.

**One pipeline, three deliverables.** A single reproducible repo produces (1) a short working paper, (2) the writing-contest essay (compressed from the paper in ≤1 day), and (3) the video contest entry (figures animated via Remotion). Everything below is scoped to ~20 focused hours across 14 days.

---

## 1. Research questions and pre-committed hypotheses

**RQ1 (empirical core).** Do public announcements of data center projects capitalize into nearby residential property values in Georgia? What is the sign, magnitude, timing, and heterogeneity of the effect?

**RQ2 (distributional, Georgist).** Who captures the value data centers create, and who bears the risk of the value that never materializes? Answered with RQ1's estimates plus documented institutional facts (sales-tax exemption, PSC generation certification, ratepayer stipulations) and an *illustrative* stranded-cost simulation.

**Hypotheses, committed before estimation** (commit this file to git before running models — a lightweight pre-registration that judges and professors will respect):

- **H1a (speculation/amenity premium):** treated ZIPs rise relative to controls after announcement (anticipated tax base, jobs, land scarcity).
- **H1b (disamenity discount):** treated ZIPs fall (noise, industrialization, transmission corridors).
- **H0:** no detectable effect — consistent with the only existing causal study (Priest 2026, Virginia). A precise null in a *new, contested* market is itself a publishable finding.
- **Heterogeneity (secondary):** rural vs. metro counties; project size (investment $ / MW); announcements before vs. after the 2024–25 backlash era.

Either sign supports the Georgist reading: a premium is community-anticipated value flowing to incumbent landowners as unearned increment; a discount alongside soaring industrial land values is privatized gains with socialized losses.

## 2. Why this matters now (problem relevance)

- Georgia's data-center sales-tax exemption is projected to cost roughly **$2.5B in state and local revenue in FY2026**, rising toward $3B in 2027 — more than Virginia, the historical epicenter. A state audit by UGA's Carl Vinson Institute estimated **~70% of Georgia data-center construction would have occurred without the exemption**. (Inside Climate News, Apr 2026; Georgia DOAA audit summary, Dec 2025.)
- The Georgia PSC certified **9,985 MW of new generation (Dec 19, 2025), ~80% for data centers**, froze Georgia Power base rates through 2028, and built remediation clauses in case contracted load fails to materialize. (GA PSC Data Center Fact Sheet, Mar 2026.)
- Nationally, "phantom" load is real: **Exelon estimates only ~22% of its 65-GW pipeline is likely to materialize**; E3 telemetry shows fewer than half of studied data centers run above 80% of reported peak load. (Power Magazine, May 2026; E3 whitepaper, Dec 2025.)
- Ratepayer-protection and exemption-repeal bills (SB 34, SB 408/410, HB 1012/1063) **all failed** in the 2026 session; the exemption stands until 2032. (Georgia Recorder / Georgia Watch, Feb–Apr 2026.)
- The state audit's own illustration of four metro-Atlanta facilities: land averaged **$26M** per complex while servers and electrical equipment added **~$1.8B** — a live diagram of George's land/capital distinction. (Capitol Beat, Jan 2026.)

The question "what do these facilities do to the value of the land around them, and who keeps that value" is unanswered for Georgia, politically urgent, and precisely Georgist.

## 3. The Henry George anchor

1. **Rent is community-created.** In *Progress and Poverty* (1879), Book IV, George's settler illustration (the "unbounded savannah" passage — verify exact wording against the primary text before quoting; e.g., the let.rug.nl edition used last cycle) shows land value arising not from the owner's effort but from the arrival of community and infrastructure. A data-center *announcement* is that mechanism compressed into a single dated event: value (or damage) created by news of collective investment, accruing to whoever holds title. RQ1 is literally an attempt to measure George's mechanism in monthly data.
2. **Land vs. capital.** The audit's $26M land / $1.8B equipment split cleanly separates what George would tax (site value) from what he would exempt (capital improvements).
3. **Corporate welfare as inverse-George.** George's remedy captures community-created value for the public; Georgia's exemption does the opposite — the public subsidizes the holder of site advantages. Pair with the audit's 70%-redundancy finding.
4. **Risk socialization.** Under the PSC stipulation, households function as involuntary insurers of speculative load (Section 6's simulation). George's critique of speculation — holding land/options on the future out of use while the community bears the cost — maps directly onto phantom interconnection queues.
5. **Remedy.** Land value taxation / land-value capture (OECD-ITF land value capture report; Plassmann & Tideman 2000 on Pennsylvania split-rate outcomes) as the policy that would convert the measured uplift into public revenue without taxing the servers.

## 4. Literature review (purposive, ~10 sources — do not expand)

**Capitalization event studies (the design's pedigree):** Oates (1969, *JPE*) — taxes/services capitalize into house prices. Davis (2011, *REStat*) — power plants reduce nearby housing values/rents. Currie, Davis, Greenstone & Walker (2015, *AER*) — 1,600 toxic plant openings/closings; the canonical "opening event" design. Linden & Rockoff (2008, *AER*) — hyperlocal shocks capitalize within months. Muehlenbachs, Spiller & Timmins (2015, *AER*) — shale development's two-sided (amenity/disamenity) capitalization. *Justification: data centers are the newest entrant in a standard family of localized-externality capitalization studies; the design is orthodox, the application is new.*

**Data-center-specific (the gap):** GMU Center for Regional Analysis (Clower & Waters, 2025) — cross-sectional 2023 NoVa sales; no statistical evidence of a negative proximity effect. Priest (2026, SSRN WP 6314620) — Virginia air-permit DiD on ZIP price indices; small, slightly positive effects; CIs rule out large declines. Integra Realty (2025) — Indiana counties, similar null. **No Georgia study; no announcement-timing design; all existing work is mature-market (NoVa) or operation-stage.** Georgia = the fastest-growing *new* market with active political contestation — an out-of-sample test with a cleaner anticipation channel.

**Methods:** Callaway & Sant'Anna (2021, *J. Econometrics*) — group-time ATTs under staggered adoption. Goodman-Bacon (2021, *J. Econometrics*) — why static TWFE is biased here. Sun & Abraham (2021, *J. Econometrics*) — interaction-weighted event studies (robustness). Roth, Sant'Anna, Bilinski & Poe (2023, *J. Econometrics*) — practitioner synthesis (cite for design choices). Rambachan & Roth (2023, *ReStud*) — honest pre-trend sensitivity (stretch goal via `HonestDiD`).

**Georgist/policy:** George (1879); OECD/ITF land-value-capture report; Plassmann & Tideman (2000); GA PSC Fact Sheet (2026); GA DOAA/Carl Vinson audit (2025); E3 large-load forecasting whitepaper (2025).

## 5. Data architecture

**D1 — Georgia data-center announcement events (the original dataset; the project's main labor).**
Target: **40–80 events, 2019–2026**, each with: company, site (address→lat/lon→ZIP), **announcement date = earliest credible public report**, investment $, MW (if stated), acreage, current status, and ≥1 verifiable source URL. Sources, in priority order: Georgia Dept. of Economic Development and Governor's Office press releases; county development-authority minutes; AJC / Atlanta Business Chronicle / Data Center Frontier coverage; datacentermap.com and baxtel.com directories for site discovery (then trace each to a dated primary announcement); the DOAA audit (counts: 63 active / 35 under construction / 249 announced) as a completeness check. **Collection is delegated to Claude (web search) but every row is human-verified by Damian** — see `events_seed.csv` schema and the verification protocol in §9. This dataset is independently valuable (professors love hand-built event data).

**D2 — Outcome panels (free, minutes to acquire).**
Primary: **Zillow ZHVI, ZIP-level, monthly, smoothed & seasonally adjusted** (CSV from zillow.com/research/data; known direct URL in `CLAUDE.md` — if it 404s, pull the current link from the data page). Robustness: **Redfin ZIP-code market tracker** (median sale price / PPSF; large TSV, documented in `CLAUDE.md`). Georgia has ~700 ZIPs with ZHVI coverage; panel ≈ 700 × ~90 months — trivially laptop-sized.

**D3 — Geography & covariates.** `tigris` ZCTA polygons + centroids; `tidycensus` ACS (population, median household income) for matching/weights; treat ZIP≈ZCTA with the standard caveat noted in limitations. Requires a free Census API key.

**D4 — Policy corpus (for essay/video + simulation parameters).** GA PSC Data Center Fact Sheet (Mar 2026); PSC Dec 19, 2025 certification order/stipulation; DOAA audit summary; E3 whitepaper; press for Exelon 22% figure. Stored as PDFs in `/refs` with a `sources.md` index so every on-screen number traces to a file.

## 6. Methods, models, and justification

**Primary estimator — Callaway–Sant'Anna staggered DiD (R, `did` package).**
Outcome: `log(ZHVI)` at ZIP-month. Treatment: ZIP contains an announced site; group `g` = announcement month. Control group: **not-yet-treated** (preferred here because "never-treated" Georgia ZIPs differ systematically from siting corridors; report never-treated as robustness). Estimation: doubly robust (`est_method="dr"`) with pre-period covariates (log population, log median income, baseline price level/trend). Aggregation: `aggte(type="dynamic")` for the event-study path (−24…+36 months) and `type="simple"` for the headline ATT. Inference: the package's multiplier bootstrap, clustered by ZIP; county-clustered as robustness. *Justification:* with staggered timing and plausibly heterogeneous effects, static TWFE is contaminated by forbidden comparisons (Goodman-Bacon 2021); CS(2021) is the field-standard fix, and using it correctly signals graduate-level competence to both HGSSS judges and UGA faculty.

**Anticipation.** Allow `anticipation = 3` months (land assembly rumors precede pressers); report 0 and 6 as sensitivity. This directly tests the Georgist "value arrives with the news" channel.

**Robustness suite (each ≤30 min once the pipeline exists):** (i) Sun–Abraham via `fixest::sunab`; (ii) Redfin outcome swap; (iii) drop 2020–21 COVID months; (iv) adjacency ring: first-ring neighbor ZIPs as a second treatment tier *and excluded from controls* (SUTVA hygiene); (v) permutation placebo on announcement dates; (vi) leave-one-out for mega-projects (e.g., the largest campuses); (vii) **ML garnish:** gradient-boosted propensity scores (`lightgbm`) to trim the control pool to comparable ZIPs — framed explicitly as a robustness/trimming step, not identification magic; (viii) stretch: `HonestDiD` pre-trend sensitivity.

**Power honesty.** With ~40–80 treated ZIPs and a smoothed index, the design detects effects on the order of ~1–2 log points; commit in advance to reporting confidence intervals and interpreting a precise null substantively (as Priest 2026 does). Never oversell.

**Sidebar model — illustrative stranded-cost Monte Carlo (Python, ~1–2 hrs).**
`Stranded_$ ~ MW_certified × (1 − p_materialize) × capex_$/kW`, with `p_materialize ~ Beta` calibrated to three labeled scenarios (optimistic ≈ 0.8; base ≈ 0.5; Exelon-like ≈ 0.22) and capex from EIA CCGT ranges; overlay the stipulation's who-pays-when timeline. Output: one fan chart + sensitivity table. **Label ILLUSTRATIVE in the figure title** — it communicates risk asymmetry (households short a put option on the AI boom); it is not a causal estimate. This is the video's third act and RQ2's quantitative garnish.

**Language split (deliberate, for skill goals):** Python for ETL/geocoding/simulation; **R for all causal inference** (`did`, `fixest`, `modelsummary`); Quarto renders the paper so every number in prose is computed, not typed.

## 7. Identification threats and disclaimers (state these in every deliverable)

1. **Siting endogeneity.** Developers choose growth corridors; treatment correlates with trends. Mitigations: not-yet-treated controls (treated ZIPs compared to future-treated peers), covariate adjustment, pre-trend plots, propensity trimming. Conclusion language stays at "capitalization consistent with," not proof.
2. **Announcement-date measurement error** (rumors precede pressers) → attenuation toward zero; anticipation windows partially absorb it.
3. **Aggregation/smoothing.** ZIP-level smoothed indices can mask hyperlocal effects within ~1 mile; a null here does not contradict resident testimony. Parcel-level analysis is explicitly flagged as future work.
4. **Spillovers/SUTVA.** Adjacent ZIPs may be treated too; they are removed from the control pool.
5. **Scope.** Findings are Georgia, 2019–2026, residential; not investment, legal, or tax advice.
6. **AI disclosure.** Contest rules require disclosing AI prompts and tools in the submission email — maintained live in `PROMPTS_LOG.md`. No author-identifying information may appear in the video or essay body.
7. **IP hygiene for the video.** Only self-generated figures/animations, self-shot or public-domain/properly licensed footage, no copyrighted music; quote George from the public-domain primary text.

## 8. Fourteen-day plan (≈20 focused hours)

| Days | Work (hrs) | Output / acceptance |
|---|---|---|
| 1 | Env setup + repo scaffold; **confirm registration status & exact rules for both contests** (1.5) | `claude` runs; repo pushed; deadline/length rules pinned in `/refs/rules.md` |
| 1–3 | D1 event collection (Claude drafts, **Damian verifies every row**) (4) | ≥40 verified rows, zero `VERIFY` flags remaining |
| 3–4 | D2/D3 panel build (2) | `panel.parquet` passes asserts (coverage, no dupes) |
| 4–6 | Estimation + event-study figure (3) | `att_gt` object saved; dynamic plot; pre-trends inspected |
| 6–7 | Robustness suite + Monte Carlo sidebar (3) | robustness table; fan chart |
| 7–9 | Working paper in Quarto (~8–10 pp) (3) | `paper.pdf` builds from clean clone |
| 9 | **Essay day**: compress paper → contest format; Damian line-edits (1.5) | essay PDF, anonymized |
| 9–12 | Video: script (from paper) → Remotion scenes fed by results JSON → VO (Damian's voice) (4) | 4–6 min MP4 (adjust to official limit), anonymized |
| 13 | Full verification pass (§9) + buffer (1) | checklist signed |
| 14 | Submit both + prompts/tools disclosure email | done |

## 9. Verification protocol (Damian's non-delegable jobs)

- **Events:** open every `source_url`; confirm company, place, and date; flip `verified_by_human` to TRUE. No unverified row enters the panel (the pipeline enforces this).
- **Numbers:** every statistic in the essay/video must exist in `output/results.json` or `/refs/sources.md`; no hand-typed figures.
- **Quotes:** check the George passage against the primary text; check the Exelon/E3/PSC figures against the stored PDFs.
- **Reproduction:** `git clone` → `make all` (or the documented run order) regenerates every figure before submission.
- **Anonymity:** grep deliverables for name/school/handles; check video metadata.

## 10. Delegation map

- **Claude (claude.ai, this project):** event-list drafting with sources, literature verification, essay compression, video script, critique passes.
- **Claude Code (the workhorse):** everything in `CLAUDE.md` — environment, package installs, data downloads, pipeline with sanity asserts, estimation, figures, Quarto build, Remotion video project. Use **plan mode** before each phase, extended thinking ("ultrathink") for the estimation phase, and the subagent roles defined in `CLAUDE.md`. Requires a Claude subscription (Pro/Max/Team/Enterprise) or Console account; native installer recommended (npm route is deprecated). Docs: code.claude.com/docs.
- **Claude Science (launched in beta June 30, 2026; included with Pro/Max/Team/Enterprise):** an AI research workbench with a coordinating agent, 60+ skills/connectors (currently biology-leaning), a reviewer agent that checks citations/calculations, and reproducible, auditable artifacts; runs locally on macOS. **Optional here** — Claude Code covers this project — but adopt its pattern: run a dedicated *reviewer pass* over the paper's citations and numbers. Separately noted for fall: Anthropic's AI-for-Science program offers up to $30k in credits (applications close **July 15, 2026**; projects Sept–Dec) — a natural vehicle for the UGA extension of this work.
- **Damian:** verification (§9), interpretation, all final judgment, voiceover, submission.

## 11. Tooling manifest (MacBook Air — full commands in `CLAUDE.md`)

Claude Code (native installer) · git + GitHub (Education pack = free Pro/private goodies; **local compute is sufficient** — the panel is tiny; Codespaces only as fallback) · Python 3.12 via `uv` (pandas, numpy, geopandas, pyarrow, requests, matplotlib, lightgbm, jupyter) · R ≥4.4 (tidyverse, did, fixest, sf, tigris, tidycensus, modelsummary, fwildclusterboot; HonestDiD from GitHub) · Quarto · Node LTS + Remotion (free for individuals; official Claude Code guide at remotion.dev/docs/ai/claude-code) · ffmpeg · QuickTime or Audacity for VO · optional DaVinci Resolve for final assembly · free Census API key.

## 12. Framing note for deliverables

Working title: **"Digital Land: Who Captures the Value When the Cloud Touches the Ground?"** Video arc: cold open on a Georgia construction site → George's settler parable → the boom in numbers → *your* event-study animation (the reveal) → the phantom-load fan chart ("and some of it may never exist — guess who's insuring it") → land value capture as the remedy → close on the audit's $26M land / $1.8B servers split. The essay follows the paper's structure; the paper follows this document.

---
*Prepared July 3, 2026. Sources cited in-line by author/outlet + date; full URLs live in `/refs/sources.md` in the repo (Claude Code Phase 0 creates it from the list in `CLAUDE.md`). This document is a plan, not a result; all empirical claims about Georgia housing effects await estimation.*
