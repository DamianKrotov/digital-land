# Digital Land — pipeline runner
# Order matters. `make all` = everything reproducible from a clean clone
# (given data/raw/events.csv with human-verified rows).

PY := uv run python
R  := Rscript

.PHONY: all download geocode qc panel estimate robustness mc paper clean help

help:
	@echo "targets: download geocode qc panel estimate robustness mc paper all"

download:            ## fetch ZHVI, ZCTA boundaries, ACS covariates (idempotent)
	$(PY) src/py/download_data.py

geocode:             ## fill missing lat/lon for events (cached, deterministic order)
	$(PY) src/py/geocode_events.py

qc:                  ## render output/events_qc.html for Damian's verification pass
	$(PY) src/py/qc_events.py

panel: download      ## build data/processed/panel.parquet (verified rows only)
	$(PY) src/py/build_panel.py

estimate: panel      ## P3: Callaway–Sant'Anna, writes output/results.json + figs
	$(R) src/r/03_estimation.R

robustness: estimate ## P4: full robustness suite
	$(PY) src/py/propensity_trim.py
	$(R) src/r/04_robustness.R

mc:                  ## P5: illustrative stranded-cost Monte Carlo
	$(PY) src/py/monte_carlo.py

paper:               ## render the working paper
	quarto render paper/paper.qmd

all: download geocode qc panel estimate robustness mc paper

clean:
	rm -rf data/processed/*.parquet output/results.json output/figs/*
