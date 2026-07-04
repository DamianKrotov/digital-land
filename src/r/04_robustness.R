# P4 — robustness suite (CLAUDE.md P4 a–h). Run after 03_estimation.R.
#   Rscript src/r/04_robustness.R
# Heavy step: the permutation placebo re-fits att_gt PLACEBO_B times
# (default 999 per spec; export PLACEBO_B=99 for a quick pass).

suppressPackageStartupMessages({
  library(did)
  library(fixest)
  library(nanoparquet)
  library(dplyr)
  library(tidyr)
  library(readr)
  library(jsonlite)
  library(modelsummary)
})

set.seed(51)
panel <- read_parquet("data/processed/panel.parquet")
base_data <- panel |> filter(!(ring1 & g_mo == 0))

run_cs <- function(data, label, control = "notyettreated", anticip = 3, boot = TRUE) {
  m <- att_gt(
    yname = "log_zhvi", tname = "mo", idname = "zip_id", gname = "g_mo",
    xformla = ~ log_pop + log_inc, data = data,
    control_group = control, est_method = "dr", anticipation = anticip,
    clustervars = "zip_id", base_period = "universal", bstrap = boot, cband = FALSE
  )
  s <- aggte(m, type = "simple", na.rm = TRUE)
  tibble(spec = label, att = s$overall.att, se = s$overall.se,
         ci_lo = s$overall.att - 1.96 * s$overall.se,
         ci_hi = s$overall.att + 1.96 * s$overall.se,
         n_treated = length(unique(data$zip_id[data$g_mo > 0])))
}

rows <- list()
rows$main <- run_cs(base_data, "(0) main: not-yet-treated, anticipation 3")

# (a) never-treated controls
rows$nev <- run_cs(base_data, "(a) never-treated controls", control = "nevertreated")

# (b) Sun–Abraham interaction-weighted event study (fixest::sunab)
sa_data <- base_data |> mutate(g_sa = if_else(g_mo == 0, 10000L, as.integer(g_mo)))
sa <- feols(log_zhvi ~ sunab(g_sa, mo) | zip_id + mo,
            data = sa_data, cluster = ~zip_id)
sa_agg <- summary(sa, agg = "att")
rows$sunab <- tibble(
  spec = "(b) Sun–Abraham (fixest::sunab), post ATT",
  att = coef(sa_agg)[["ATT"]], se = se(sa_agg)[["ATT"]],
  ci_lo = att - 1.96 * se, ci_hi = att + 1.96 * se,
  n_treated = rows$main$n_treated
)

# (c) Redfin outcome swap — only if the (large, optional) download exists
redfin_path <- "data/raw/redfin_zip.tsv.gz"
if (file.exists(redfin_path)) {
  rf <- read_tsv(redfin_path, col_select = c(
    "period_begin", "region", "state_code", "property_type", "median_sale_price"
  ), show_col_types = FALSE) |>
    filter(state_code == "GA", property_type == "All Residential") |>
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

# (f) permutation placebo on announcement dates
B <- as.integer(Sys.getenv("PLACEBO_B", "999"))
treated_ids <- base_data |> filter(g_mo > 0) |> distinct(zip_id) |> pull()
g_range <- range(base_data$g_mo[base_data$g_mo > 0])
placebo_att <- numeric(B)
cat("permutation placebo:", B, "draws over g in [", g_range[1], ",", g_range[2], "]\n")
for (b in seq_len(B)) {
  # one placebo announcement month per treated zip, uniform over observed g range
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
  placebo_att[b] <- est
  if (b %% 50 == 0) cat("  draw", b, "/", B, "\n")
}
actual <- rows$main$att
p_placebo <- mean(abs(placebo_att) >= abs(actual), na.rm = TRUE)

# ---- outputs ----
tab <- bind_rows(rows)
dir.create("output/tables", recursive = TRUE, showWarnings = FALSE)
write_csv(tab, "output/robustness.csv")
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
