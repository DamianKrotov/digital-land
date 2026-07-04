# sources.md — every external number → source

Rule (CLAUDE.md guardrail / ARCHITECTURE §9): any statistic that appears in the
paper, essay, or video and does NOT come from `output/results.json` must appear
here with a URL and accessed date. All URLs below were retrieved and quote-checked
by Claude on 2026-07-03/04; **Status stays `pending` until Damian opens the URL
and checks the figure himself**, then flips to `ok`.

⚠ Two corrections to ARCHITECTURE §2 discovered during verification — use the
corrected attributions in all deliverables (details below the table):
- **C1:** the "$2.5B FY2026 / ~$3B 2027" cost is from the OPB Tax Expenditure
  Report, NOT the DOAA audit (audit's own state-only figures are much lower).
- **C2:** the PSC's Dec 19, 2025 release says **9,885 MW**; only the Mar 2026
  fact sheet says 9,985 MW. Cite as "9,885 MW per the Dec 19 release."

| # | Claim | Source (date) | URL | Status |
|---|---|---|---|---|
| S1 | Data-center exemptions cost ~$2.47B state+local FY2026, ~$2.99B FY2027 (sum of items 4.06810 + 4.06800) | **OPB, FY 2027 Georgia Tax Expenditure Report (Jan 2026)** — see C1 | https://opb.georgia.gov/document/tax-expenditure-reports-current-year/fy-2027-tax-expenditure-report/download | pending |
| S1b | Same figures as reported in press: "roughly $2.5 billion … climb to about $3 billion in 2027" | Inside Climate News (2026-04-09, Ryan Krugman); AJC (2026-02) | https://insideclimatenews.org/news/09042026/georgia-legislature-data-center-bills-fail/ (live site 403s bots; text verified via Wayback 2026-05-10 snapshot) · https://www.ajc.com/business/2026/02/georgias-sales-tax-breaks-for-data-centers-tally-more-than-25-billion/ | pending |
| S2 | "70% would exist in the absence of the exemption" (30% attributable) | DOAA summary of Carl Vinson Institute report (Dec 2025, rev. Jan 2026) | https://www.audits2.ga.gov/wp-content/uploads/2025/12/Data-Center-Tax-Exemption-Summary-Revised.pdf · full report: https://www.audits.ga.gov/ReportSearch/download/33298 | pending |
| S3 | "63 active data centers, 35 under construction, and another 249 that have been announced" (as of Dec 2025, per Aterio) | DOAA full report p. 10 | https://www.audits.ga.gov/ReportSearch/download/33298 | pending |
| S4 | "Representative" complex from four metro-ATL projects ($6.5B, nine buildings): servers/equipment ≈ **$1.81B**, land ≈ **$26.1M**, total FMV $2.28B. NOTE: composite illustration, not a literal average of four facilities | DOAA full report; Capitol Beat coverage (Ty Tagami, 2026-01-05) | https://capitol-beat.org/2026/01/state-report-says-data-centers-a-boon-to-economy-despite-tax-giveaway/ | pending |
| S4b | Audit was **revised** after an error inflated jobs/economic value ~3x — cite only revised numbers | Capitol Beat (Jan 2026) | https://capitol-beat.org/2026/01/error-in-state-auditors-data-center-review-inflated-job-production-and-economic-value/ | pending |
| S5 | PSC approved stipulation certifying **9,885 MW** (release) / "9,985 MW … ~80% expected to power data centers" (fact sheet); base-rate freeze through 2028; remediation menu + Georgia Power financial backstop through 2031 | GA PSC (Dec 19, 2025 release; Mar 2026 fact sheet; Dockets 56298/56310 stipulation) — see C2 | https://psc.ga.gov/site/downloads/datacenterfactsheet.pdf · https://psc.ga.gov/site/assets/files/9176/media_advisory_dec_19_decision.pdf · stipulation: https://psc.ga.gov/search/facts-document/?documentId=224772 | pending |
| S6 | "Exelon … said only 22% of its 65-GW pipeline through 2040 is likely to materialize" | POWER Magazine, Tom Bailey (2026-05-15); underlying: FT | https://www.powermag.com/phantom-data-centers-didnt-break-the-power-grid-they-proved-it-was-already-broken/ · context: https://www.utilitydive.com/news/exelon-data-center-amazon-earnings-maryland/804720/ | pending |
| S7 | "Only two data centers had load factors above 90% … fewer than half had load factors above 80%"; PG&E: peaks ≈67% of nameplate | E3, "Forecasting Large Loads in the Age of AI and Data Centers" (Dec 2025), ~p.4 | https://www.ethree.com/wp-content/uploads/2025/12/E3Whitepaper_DataCenterForecasting.pdf | pending |
| S8 | 2026 session: SB 34 stalled; SB 408 no Senate vote; SB 410 failed after crossover; HB 1012 (moratorium) dead; HB 1063 died in Senate; exemption stands to **2032** | Inside Climate News (2026-04-09); Georgia Recorder (2026-02-26); Georgia Watch repost of AJC (2026-04-04) | https://georgiarecorder.com/2026/02/26/data-center-bill-stalls-after-last-minute-change-opposed-by-industry-finds-support/ · https://georgiawatch.org/georgia-lawmakers-leave-data-center-tax-breaks-intact-punt-on-energy-costs/ | pending |
| S9 | CCGT overnight capital cost: **$868/kW** (2×2×1 H-class) – **$921/kW** (1×1×1) in 2023$ (S&L for EIA, Dec 2023); AEO2026 (Apr 2026, 2025$): **$1,032–$1,086/kW**; Atlanta location multiplier ≈1.02. Trade-press caveat: 2025–26 turnkey quotes run higher | EIA capital-cost study + AEO2026 EMM assumptions Table 3 | https://www.eia.gov/analysis/studies/powerplants/capitalcost/pdf/capital_cost_AEO2025.pdf · https://www.eia.gov/outlooks/aeo/assumptions/pdf/EMM_Assumptions.pdf | pending |
| S10 | Savannah passage, *Progress and Poverty* Bk IV Ch. 2: "Here, let us imagine, is an unbounded savannah, stretching off in unbroken sameness of grass and flower, tree and rill, till the traveler tires of the monotony…" … "He has what, were he in a populous district, would make him rich; but he is very poor." (US spelling "traveler" in Gutenberg ed.) | Project Gutenberg #55308 (public domain) | https://www.gutenberg.org/ebooks/55308 · text: https://www.gutenberg.org/cache/epub/55308/pg55308.txt | pending |

## Monte Carlo parameters (refs/mc_params.json)

`mw_certified = 9885` (S5, Dec 19 release — the conservative primary figure);
`capex_usd_per_kw ∈ [1032, 1086]` (S9, AEO2026 2025$, no CCS);
scenario means {optimistic 0.8, base 0.5, exelon 0.22} (0.22 from S6).
Damian: check each against the URLs above, then set `"verified": true`.

## Literature (cited in paper; no numbers borrowed without page refs)

Oates 1969 JPE · Davis 2011 REStat · Currie–Davis–Greenstone–Walker 2015 AER ·
Linden & Rockoff 2008 AER · Muehlenbachs–Spiller–Timmins 2015 AER ·
GMU CRA (Clower & Waters) 2025 · Priest 2026 SSRN 6314620 (TODO_VERIFY exact title/author) ·
Integra Realty 2025 · Callaway & Sant'Anna 2021 · Goodman-Bacon 2021 ·
Sun & Abraham 2021 · Roth–Sant'Anna–Bilinski–Poe 2023 · Rambachan & Roth 2023 ·
George 1879 · OECD/ITF land value capture · Plassmann & Tideman 2000.
