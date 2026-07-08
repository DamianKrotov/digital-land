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

# ---- P6 video (Remotion) ----
bake-video:          ## regenerate video/src/data/video_data.json (asserts inside)
	$(PY) src/py/make_video_data.py

video-dev:           ## Remotion Studio for interactive review
	cd video && npx remotion studio

video-animatic: bake-video  ## v1 for owner review: captions + HUD burned in, no VO
	cd video && npx remotion render DigitalLand out/digital-land-animatic.mp4 --codec=h264

video-final: bake-video     ## re-times scenes from recorded VO WAVs; refuses if facts unverified
	cd video && npx remotion render DigitalLand out/digital-land-final.mp4 --props='{"mode":"final"}' --codec=h264

video-stills:        ## one QC frame per scene -> video/out/stills/
	cd video && for s in 1 2 3 4 5 6 7; do npx remotion still thumb-S$$s out/stills/S$$s.png --frame=200; done

video-qc:            ## duration/metadata/identity/determinism gate; final also scrubs+louds
	$(PY) src/py/qc_video.py video/out/digital-land-final.mp4 --mode final

video-qc-animatic:
	$(PY) src/py/qc_video.py video/out/digital-land-animatic.mp4 --mode animatic

all: download geocode qc panel estimate robustness mc paper

clean:
	rm -rf data/processed/*.parquet output/results.json output/figs/*
