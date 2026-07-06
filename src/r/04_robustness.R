# P4 — robustness suite (CLAUDE.md P4 a–h). Run after 03_estimation.R.
#   Rscript src/r/04_robustness.R
# CHECKPOINTED: the spec table is written to output/robustness.csv as soon as
# it is computed, and each permutation-placebo draw is appended to
# output/placebo_draws.csv with a per-draw seed — so an interrupted run
# resumes instead of restarting (delete those files to force a full refit).
# PLACEBO_B sets the number of draws (default 999 per spec; 199 for a quick pass).

suppressPackageStartupMessages({
  library(did)
  library(fixest)
  library(nanoparquet)
  library(dplyr)
  library(tidyr)
  library(readr)
  library(tibble)
  library(jsonlite)
  library(modelsummary)
})

set.seed(51)
panel <- read_parquet("data/processed/panel.parquet")
base_data <- panel |> filter(!(ring1 & g_mo == 0))

run_cs <- function(data, label, control = "notyettreated", anticip = 3, boot = TRUE,
                   method = "reg", xf = ~ log_pop + log_inc) {
  # est_method="reg" mirrors 03_estimation.R (dr infeasible with singleton cohorts)
  m <- att_gt(
    yname = "log_zhvi", tname = "mo", idname = "zip_id", gname = "g_mo",
    xformla = xf, data = data,
    control_group = control, est_method = method, anticipation = anticip,
    clustervars = "zip_id", base_period = "universal", bstrap = boot, cband = FALSE,
    allow_unbalanced_panel = TRUE
  )
  s <- aggte(m, type = "simple", na.rm = TRUE)
  tibble(spec = label, att = s$overall.att, se = s$overall.se,
         ci_lo = s$overall.att - 1.96 * s$overall.se,
         ci_hi = s$overall.att + 1.96 * s$overall.se,
         n_treated = length(unique(data$zip_id[data$g_mo > 0])))
}

# ---------------------------------------------------------------- spec table
tab_path <- "output/robustness.csv"
if (file.exists(tab_path)) {
  tab <- read_csv(tab_path, show_col_types = FALSE)
  cat("specs loaded from checkpoint", tab_path, "— delete it to refit\n")
} else {
  rows <- list()
  rows$main <- run_cs(base_data, "(0) main: not-yet-treated, anticipation 3")

  # (a) never-treated controls
  rows$nev <- run_cs(base_data, "(a) never-treated controls", control = "nevertreated")

  # (a') estimator variants (pre-registered dr is infeasible with covariates on
  # singleton cohorts; these bracket the covariate/estimator choice)
  rows$drnc <- run_cs(base_data, "(a') dr, no covariates", method = "dr", xf = ~1)
  rows$ipw <- run_cs(base_data, "(a'') ipw + covariates", method = "ipw")

  # (b) Sun–Abraham interaction-weighted event study (fixest::sunab)
  # never-treated must be cohort=NA for sunab (a large sentinel like 10000
  # generates ~-9700 relative-period dummies and a degenerate tiny SE)
  sa_data <- base_data |> mutate(g_sa = if_else(g_mo == 0, NA_integer_, as.integer(g_mo)))
  sa <- feols(log_zhvi ~ sunab(g_sa, mo) | zip_id + mo,
              data = sa_data, cluster = ~zip_id)
  sa_agg <- summary(sa, agg = "att")
  sa_att <- coef(sa_agg)[["ATT"]]
  sa_se <- se(sa_agg)[["ATT"]]
  # NOTE: sunab's "att" equal-weights ALL post horizons (to +131 months for the
  # earliest cohort), a different estimand than the CS simple ATT — comparable
  # in sign, not in magnitude/SE. Window-capping breaks the IW variance
  # (singleton cells), so the uncapped estimate is reported with this caveat.
  rows$sunab <- tibble(
    spec = "(b) Sun–Abraham IW, all-horizon post ATT (different estimand — see text)",
    att = sa_att, se = sa_se,
    ci_lo = sa_att - 1.96 * sa_se, ci_hi = sa_att + 1.96 * sa_se,
    n_treated = rows$main$n_treated
  )

  # (c) Redfin outcome swap — only if the (large, optional) download exists
  redfin_path <- "data/raw/redfin_zip.tsv.gz"
  if (file.exists(redfin_path)) {
    rf <- read_tsv(redfin_path, col_select = c(
      "PERIOD_BEGIN", "PERIOD_DURATION", "REGION", "STATE_CODE",
      "PROPERTY_TYPE", "MEDIAN_SALE_PRICE"
    ), show_col_types = FALSE) |>
      rename_with(tolower) |>
      filter(state_code == "GA", property_type == "All Residential") |>
      # keep the shortest reporting window offered (30d if present, else 90d rolling)
      filter(period_duration == min(period_duration)) |>
      mutate(
        zip = gsub("\\D", "", region),
        mo = (as.integer(substr(period_begin, 1, 4)) - 2000) * 12 +
             as.integer(substr(period_begin, 6, 7)) - 1
      ) |>
      group_by(zip, mo) |>
      summarise(price = median(median_sale_price, na.rm = TRUE), .groups = "drop") |>
      filter(is.finite(price), price > 0)
    rf_panel <- base_data |>
      distinct(zip, zip_id, g_mo, log_pop, log_inc) |>
      inner_join(rf, by = "zip") |>
      mutate(log_zhvi = log(price))
    rows$redfin <- run_cs(rf_panel, "(c) Redfin median sale price outcome")
  } else {
    message("(c) skipped: ", redfin_path, " not downloaded (run download_data.py --redfin)")
  }

  # (d) drop COVID months 2020-01..2021-12 (mo 240..263)
  rows$covid <- run_cs(base_data |> filter(mo < 240 | mo > 263), "(d) drop 2020-01..2021-12")

  # (e) anticipation windows 0 and 6
  rows$ant0 <- run_cs(base_data, "(e) anticipation = 0", anticip = 0)
  rows$ant6 <- run_cs(base_data, "(e') anticipation = 6", anticip = 6)

  # (g) leave-one-out: drop top-3 projects by announced investment
  emap <- read_csv("data/processed/event_zip_map.csv", show_col_types = FALSE)
  top3_zips <- emap |> arrange(desc(investment_usd_m)) |> slice_head(n = 3) |> pull(zcta)
  rows$loo <- run_cs(base_data |> filter(!zip %in% top3_zips),
                     "(g) drop top-3 investment projects")

  # (h) lightgbm propensity-trimmed control pool (src/py/propensity_trim.py)
  trim_path <- "output/trimmed_controls.csv"
  if (file.exists(trim_path)) {
    keep_controls <- read_csv(trim_path, show_col_types = FALSE)$zip
    rows$trim <- run_cs(base_data |> filter(g_mo > 0 | zip %in% keep_controls),
                        "(h) propensity-trimmed controls")
  } else {
    message("(h) skipped: run `uv run python src/py/propensity_trim.py` first")
  }

  tab <- bind_rows(rows)
  dir.create("output", showWarnings = FALSE)
  write_csv(tab, tab_path)
  cat("spec table checkpointed ->", tab_path, "\n")
}
actual <- tab$att[grepl("^\\(0\\)", tab$spec)][1]

# ------------------------------------- (f) permutation placebo, checkpointed
B <- as.integer(Sys.getenv("PLACEBO_B", "999"))
treated_ids <- base_data |> filter(g_mo > 0) |> distinct(zip_id) |> pull()
g_range <- range(base_data$g_mo[base_data$g_mo > 0])
draws_path <- "output/placebo_draws.csv"
done <- if (file.exists(draws_path)) read_csv(draws_path, show_col_types = FALSE)$b else integer(0)
todo <- setdiff(seq_len(B), done)
cat("permutation placebo:", length(todo), "of", B, "draws remaining, g in [",
    g_range[1], ",", g_range[2], "]\n")
for (b in todo) {
  set.seed(51 + b)  # per-draw seed: resumed runs reproduce a fresh full run
  draw <- tibble(zip_id = treated_ids,
                 g_fake = sample(seq(g_range[1], g_range[2]), length(treated_ids), replace = TRUE))
  fake <- base_data |>
    left_join(draw, by = "zip_id") |>
    mutate(g_mo = coalesce(g_fake, 0L)) |>
    select(-g_fake)
  est <- tryCatch(
    run_cs(fake, "placebo", boot = FALSE)$att,
    error = function(e) NA_real_
  )
  write_csv(tibble(b = b, att = est), draws_path, append = file.exists(draws_path))
  if (b %% 25 == 0) cat("  draw", b, "/", B, "\n")
}
placebo_att <- read_csv(draws_path, show_col_types = FALSE) |>
  filter(b <= B) |> pull(att)
p_placebo <- mean(abs(placebo_att) >= abs(actual), na.rm = TRUE)

# ---------------------------------------------------------------- outputs
dir.create("output/tables", recursive = TRUE, showWarnings = FALSE)
datasummary_df(
  tab |> mutate(across(where(is.numeric), \(x) round(x, 4))),
  output = "output/tables/robustness_table.html",
  title = sprintf("Robustness: simple ATT on log home value. Permutation placebo p = %.3f (B=%d)",
                  p_placebo, B)
)

res_path <- "output/results.json"
results <- if (file.exists(res_path)) fromJSON(res_path, simplifyVector = FALSE) else list()
results$robustness <- c(
  setNames(lapply(seq_len(nrow(tab)), function(i) as.list(tab[i, ])), tab$spec),
  list(placebo = list(p_value = p_placebo, B = B, actual_att = actual))
)
writeLines(toJSON(results, auto_unbox = TRUE, pretty = TRUE, digits = 8, na = "null"), res_path)

cat(sprintf("robustness ok: %d specs, placebo p = %.3f -> output/robustness.csv, results.json\n",
            nrow(tab), p_placebo))
