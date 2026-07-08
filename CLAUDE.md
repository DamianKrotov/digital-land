# CLAUDE.md — Digital Land (GA data centers → property values)

Research repo for the HGSSS 2026 contest (college division, theme: Land Value
Taxation) producing: (1) working paper, (2) essay, (3) 3–5 min video.
Owner: Damian (he verifies and voices; you build). Read `docs/ARCHITECTURE.md`
for the original plan; this file reflects CURRENT state.

**Deadlines:** registration summary emailed by **Jul 17, 2026** (draft ready in
`essay/registration_summary.md`); final essay + video emailed to
contests@hgsss.org by **Jul 31, 11:59 PM ET** (rules pinned in `refs/rules.md`).

## Hard guardrails (never violate)

1. **Never fabricate data, dates, coordinates, statistics, or citations.** If a
   value is unknown, write `TODO_VERIFY` and stop to ask.
2. Every row in `data/raw/events.csv` carries ≥1 working `source_url`. Rows with
   `verified_by_human=FALSE` are **excluded from analysis by code** (build_panel
   exits; no override).
3. If a download URL 404s, don't guess an alternative silently — find the
   provider's current link and confirm with Damian.
4. Deterministic everything: seeds 51 (`set.seed(51)` / `default_rng(51)`),
   versions pinned (`uv.lock`, `renv.lock`, `video/package-lock.json`).
5. Sanity asserts in every pipeline step. A step without asserts is unfinished.
6. Append a one-line summary of every session to `PROMPTS_LOG.md` (contest
   requires AI disclosure in the submission email).
7. No author-identifying info in essay/video (name/school go in the email ONLY).
   `src/py/qc_video.py` greps for identity strings — keep it that way. Only
   self-generated figures; no copyrighted music/footage; licenses receipted in
   `refs/sources.md` ("Video asset licensing" table).
8. Prefer boring, readable code. Functions + docstrings; no notebooks in src/.
9. **No statistic reaches a deliverable except from `output/results.json` or a
   `refs/sources.md` row.** Video facts additionally gate on
   `refs/video_facts.json "verified": true` (same pattern as `refs/mc_params.json`).

## State (2026-07-08) — P0–P5 done, P6 video built, awaiting owner inputs

| Piece | Status |
|---|---|
| Events dataset | **50 rows, 48 verified** (`data/raw/events.csv`); judgment calls in `data/raw/verification_log.md`; open leads in `data/raw/leads_unconfirmed.md` |
| Panel | `data/processed/panel.parquet`: 31 treated / 519 control ZIPs, 2012→2026, ring-1 excluded |
| **Headline result** | ATT **+1.2%** (se 2.8), 95% CI [−4.3, +6.8] — a null; pre-trends 0/23 significant; placebo p=0.889 (B=199; rerun at 999 via `make robustness` if desired); 11 robustness specs all null |
| Monte Carlo | stranded-cost medians $2.0/$5.2/$8.2B (optimistic/base/Exelon) — ILLUSTRATIVE |
| Paper | `paper/paper.pdf` renders end-to-end, all numbers interpolated |
| Video | animatic **v2** at ~4:28 (`video/out/digital-land-animatic-v2.mp4`), all 7 scenes data-driven; VO + music + facts-verification pending (below) |
| Estimator note | pre-registered `dr` infeasible (singleton cohorts break the pscore) → primary is `reg` with covariates; documented in `src/r/03_estimation.R` and the paper |

## Remaining work (owner-blocking first)

1. **Damian:** email registration summary (Jul 17!). Spot-check the 5 judgment
   calls in `verification_log.md`. Verify `refs/video_facts.json` values against
   `refs/sources.md` URLs — incl. the **Twiggs County population TODO** (verify
   via Census QuickFacts or cut the clause from the S3 script) — then set
   `"verified": true` and run `make bake-video`.
2. **Damian:** watch animatic v2; edit script/pacing ONLY in
   `video/src/manifest/timing.ts` (captions = the VO recording script). Record
   one WAV per scene → `video/public/audio/vo/S1.wav … S7.wav` (mono 48kHz).
   Drop a CC0 music bed at `video/public/audio/music/bed.mp3` + license receipt
   (freepd.com pre-vetted; add row to sources.md licensing table).
3. **Claude Code:** after VO lands — `make video-final && make video-qc`; the
   QC emits `*-final-clean.mp4` (metadata-scrubbed) = the ONLY file submitted.
   Tune `voTailSec`/`musicVolume` in timing.ts if beats feel off.
4. Essay day: compress `paper/paper.qmd` → `essay/essay.qmd` (10–25 pp
   double-spaced, anonymized; stub is wired).
5. Anonymity caveat for the video: the S7 credits cite the paper title and say
   the replication repo is "linked with the submission" — deliberately NOT the
   GitHub URL, because the username identifies the author and rules ban
   author-identifying info in the entry. If a burned-in URL is wanted, mirror
   the repo under a neutral account first, then update `S7Credits.tsx` (the
   identity grep in qc_video.py will flag anything else).

## Commands (Makefile from repo root)

```
make download geocode qc     # data refresh + events QC report (output/events_qc.html)
make panel estimate          # panel + CS estimation -> output/results.json + figs
make robustness mc paper     # robustness table+placebo, fan chart, paper.pdf
make bake-video              # video/src/data/video_data.json (deterministic; facts gate)
make video-dev               # Remotion Studio
make video-animatic          # captions+HUD draft render
make video-final video-qc    # VO-timed render + submission gate
```

Environment quirks: Quarto lives at `~/.local/bin/quarto` (cask needs sudo);
render with `QUARTO_PYTHON=.venv/bin/python`. `CENSUS_API_KEY` is exported in
`~/.zshrc`. Long R jobs must checkpoint (see 04_robustness.R) — this machine's
sessions kill background processes. Model `.rds` files are gitignored (>100MB).

## Repo layout (delta from ARCHITECTURE)

```
data/raw/events.csv                hand+AI-verified event dataset (the crown jewel)
data/raw/verification_log.md       row-by-row provenance + judgment calls
refs/sources.md                    every external number -> URL + licensing table
refs/video_facts.json              on-screen facts gate (verified:false until Damian)
output/results.json                single source of truth for all reported numbers
src/py/make_video_data.py          video data baker    src/py/qc_video.py  submission gate
video/src/manifest/timing.ts       script + pacing + mix (the ONE file Damian edits)
video/src/scenes/S1..S7*.tsx       data-driven scenes  video/out/          renders
```

## Session etiquette

Start: read this file, state the phase, propose a plan, wait for approval.
End: update `PROMPTS_LOG.md`, commit with a descriptive message, list open
`TODO_VERIFY` items for Damian.
