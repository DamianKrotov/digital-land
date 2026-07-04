# Unconfirmed leads — research pass P2 COMPLETE (2026-07-04)

P2 discovery pass finished: 25 new rows written to `events_new_draft.csv`
(GA025–GA049), all with fetched, dated sources (verified_by_human=TRUE).
Project total is now 24 + 25 = 49 events, exceeding the ≥40 target.
Do NOT merge draft rows into events.csv until the GA001–GA024 verification
pass finishes (event_id sequence assumes no renumbering).

## Lead dispositions

| Lead | Status | Resolution |
|---|---|---|
| Vantage Data Centers, Douglasville | RESOLVED → GA025 | DCD 2023-08-21 (DRI, 3 bldgs 1.657M sqft). Bonus: Inside Towers 2024-08-16 revealed two MORE Fulton Co sites → GA026 (Westlake/South Fulton) + GA027 (Stacks Road) |
| Edged (Endeavour), Atlanta | RESOLVED → GA028 | DCD 2023-07-03 groundbreaking; 180MW Tilford Yard, 1986 Marietta Rd |
| DataBank ATL expansions | RESOLVED → GA029, GA030 | Own PRs fetched: ATL4/Lithia Springs land buy 2022-05-17; 95-acre expansion 2023-10-31. County left TODO_VERIFY (PR says only "suburban Atlanta"). xAI tenancy rumor not sourced — ignored |
| Flexential Douglasville | RESOLVED → GA032 | DCD 2022-03-23 (22.5MW D1) + PR 2023-07-11 (36MW D2), one campus row |
| Microsoft Douglasville | RESOLVED → GA031 | DCD 2021-08-16 (FTY101, 1601 N River Rd); announce = Feb 2021 East US 3 region announcement (month precision; Azure blog fetch timed out — pin exact day) |
| Digital Realty / CoreSite / H5 new GA ≥2019 | RESOLVED (2 of 3) | Digital Realty → GA037 (ATL15/16 Fort Gillem, DCD 2025-06-05). H5 → GA049 (Courtland St +3MW, DCD 2021-12-17). CoreSite: DEAD — no new GA campus announcement ≥2019 found (AT1/AT2 pre-date window) |
| Bulloch County project(s) | DEAD (no event row) | No dated project announcement exists; county went straight to moratoriums (Feb 2026) → draft outright ban (May 2026); Statesboro passed restrictive ordinance instead. No pending applications as of Feb 2026. Useful for the ordinance/heterogeneity narrative only |
| ConstructConnect $4.5B / 2.2M sqft | RESOLVED → GA042 | = Project Springbank, Atlas Development LLC, BARTOW County (ConstructConnect 2025-02-19). Distinct from GA023 Project Bunkhouse |
| Tract, Newton County | DEAD | No evidence found of Tract (the Denver/Reno land-bank developer) in Newton Co or GA; earlier hits were the generic word "tract". Newton Co activity is TPA (GA039), Sailfish (GA040), Gregory Rd (GA041), Serverfarm (GA038), AWS land (GA045) |
| PowerHouse / Sailfish / CloudHQ / Aligned / NTT / Iron Mountain / Novva / Yondr | PARTIAL | Sailfish → RESOLVED GA040 (Social Circle, DCD 2024-11-20). CloudHQ/NTT/Novva/Yondr/PowerHouse/Iron Mountain: DEAD — no GA announcements found. Aligned: STILL-OPEN — ATL-01 exists (1551 N River Rd, Lithia Springs, 70MW per directories) but no dated announcement located; try Aligned newsroom archive / AJC |
| Fairwater Atlanta exact site (GA015) | STILL-OPEN | Untouched — belongs to the GA001–GA024 verification pass |
| QTS non-Fayetteville GA expansions | RESOLVED → GA033, GA034, GA035, GA036 | Project Granite downtown ATL (DCD 2021-04-16); Suwanee 1 DC2 (QTS blog 2023-01-23); PLUS two new campuses found: Augusta/Gordon Hwy (WRDW 2025-12-26; Eagle South DRI Jun 2024; ex-T5 site) and Blakely "Project Blue Hole" (Early Co, dev authority 2025-11-24, up to 12M sqft) |
| Systematic sweep (georgia.org + gov.georgia.gov) | DONE — nothing new | State pressers filtered to data centers only surfaced already-covered projects (AWS Butts/Douglas 2025-01, Microsoft, T5, Atlas). Kemp newsroom: no per-project DC pressers found 2022–2024 (data centers get DRI filings + local coverage, not gubernatorial pressers). Kemp VETOED the 2024 tax-break pause (HB 1192) — policy context, not an event |
| Withdrawn/denied projects | RESOLVED → GA047, GA048 | Monroe Co/Bolingbroke 900+ ac DENIED unanimously Aug 2025 (govtech 2025-08-06); EagleRock Crooked Creek 600+ ac Jones Co WITHDRAWN Oct 2025 (DCD 2025-10-22). GPB 2025-10-22 ordinance-wave story itself names NO killed projects — moratoria: Pike/Lamar/Troup/Clayton/LaGrange (Sep 2025), Coweta (May 2025), DeKalb; ordinances: Bartow/Jones/DeKalb/Lumpkin/Forsyth/Atlanta-BeltLine |

## New still-open leads surfaced in P2 (for a P3 pass, if any)

- **Atlas Development in Floyd and Carroll counties** — DeSmog 2026-04-07 (fetched)
  says Atlas bought land for "several large-scale data centers" in Bartow, Floyd,
  and Carroll since 2024. Bartow = GA023/GA042; Floyd/Carroll undated → no rows yet.
- **Switch second GA campus (GA017 fix)** — GPB ordinance story places a Switch
  facility "near Cartersville" (Bartow) with a second planned; GA017 currently says
  Douglas TODO_VERIFY. Flag for the verification agent.
- **Coweta's five proposed data centers** — times-herald tracker page
  (times-herald.com/data_center/where-cowetas-five-proposed-data-centers-stand)
  implies 1–2 Coweta proposals beyond GA006/GA018/GA043; times-herald rate-limited
  (HTTP 429) this session.
- **Earlier-date pins**: GA043 Project Peach (times-herald ~Mar 2025), GA044 AWS
  Lamar (AJC ~2025-08-04), GA047 Monroe proposal coverage (~Jul 2025), GA048 Jones
  proposal coverage (13WMAZ ~Sep/Oct 2025), GA041 Gregory Rd annexation coverage
  (rockdalenewtoncitizen ~Dec 2024) — all could move announce_date slightly earlier.
- **Sailfish Social Circle expansion / "second data center"** — betweencommunitynews
  + covnews report a second approval; may warrant an expansion row once dated.
- **DataBank ATL4/ATL5 county** — pin whether 200 Selig Dr / 95-acre parcel are
  Fulton or Douglas (PRs say only "suburban Atlanta" / "near Lithia Springs").
