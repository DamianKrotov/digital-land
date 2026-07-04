# run.md — exact command order (mirrors Makefile)

Environment (once):

```bash
brew install git r uv                 # done 2026-07-03
# quarto: brew cask needs sudo; installed instead to ~/.local/opt (v1.9.38) with
# a symlink at ~/.local/bin/quarto — add ~/.local/bin to PATH in ~/.zshrc.
# TinyTeX installed via `quarto install tinytex`.
uv sync                               # creates .venv from pyproject.toml/uv.lock
Rscript src/r/00_setup_packages.R     # done 2026-07-04 (renv.lock written)
export CENSUS_API_KEY=...             # REQUIRED for ACS: Census API no longer serves
                                      # keyless requests (checked 2026-07-03).
                                      # Sign up: https://api.census.gov/data/key_signup.html
# render with the venv python:
#   QUARTO_PYTHON=.venv/bin/python quarto render paper/paper.qmd
```

Pipeline (from repo root):

```bash
make download     # data/raw: zhvi_zip.csv, ZCTA boundaries, acs_zcta.csv
make geocode      # data/processed/events_geocoded.csv (raw events.csv untouched)
make qc           # output/events_qc.html  ← Damian verifies rows, flips verified_by_human
make panel        # data/processed/panel.parquet  (VERIFIED rows only; exits if none)
make estimate     # output/results.json, output/figs/eventstudy.*
make robustness   # robustness table + placebo p-value
make mc           # fan chart (requires refs/mc_params.json with verified:true)
make paper        # paper/paper.pdf
```

Gate: `make panel` and everything after it refuse to run until at least one row in
`data/raw/events.csv` has `verified_by_human=TRUE` (hard guardrail #2 in CLAUDE.md).
The QC report and geocoding run on unverified rows — that is their purpose.
