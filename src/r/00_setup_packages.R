# One-time R package setup. Run: Rscript src/r/00_setup_packages.R
# Uses renv for version pinning (CLAUDE.md hard guardrail #4).
#
# Note: Homebrew R installs packages from source, so this list is kept lean.
# - nanoparquet (pure R) reads panel.parquet; the heavier `arrow` is not needed.
# - sf/tigris/tidycensus are NOT needed: all geometry/ACS work happens in Python
#   (src/py/). They are in the ARCHITECTURE manifest as options; install later
#   only if an R-side map is wanted.
# - HonestDiD (stretch): remotes::install_github("asheshrambachan/HonestDiD")

if (!requireNamespace("renv", quietly = TRUE)) install.packages("renv", repos = "https://cloud.r-project.org")

if (!file.exists("renv.lock")) {
  renv::init(bare = TRUE, restart = FALSE)
} else {
  renv::activate()
}

pkgs <- c(
  "did", "fixest", "dplyr", "tidyr", "readr", "tibble", "ggplot2",
  "jsonlite", "modelsummary", "nanoparquet"
)
missing <- pkgs[!vapply(pkgs, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing)) renv::install(missing)

renv::snapshot(prompt = FALSE, type = "all")
cat("R setup ok. Available:", paste(pkgs, collapse = ", "), "\n")
