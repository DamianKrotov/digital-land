# P3 — Callaway–Sant'Anna staggered DiD on log ZHVI (spec: CLAUDE.md P3, ARCHITECTURE §6).
# Run from repo root: Rscript src/r/03_estimation.R
# Every number reported anywhere downstream comes from output/results.json — no hand-typing.

suppressPackageStartupMessages({
  library(did)
  library(nanoparquet)  # pure-R parquet reader (arrow is overkill for this panel)
  library(dplyr)
  library(tibble)
  library(ggplot2)
  library(jsonlite)
})

set.seed(51)

panel <- read_parquet("data/processed/panel.parquet")

# SUTVA hygiene: ring-1 neighbors of treated ZCTAs are excluded from the
# control pool (they may be partially treated). Treated ZCTAs stay regardless.
n_ring_dropped <- panel |> filter(ring1, g_mo == 0) |> distinct(zip) |> nrow()
est_data <- panel |> filter(!(ring1 & g_mo == 0))
cat("dropped", n_ring_dropped, "ring-1 control ZIPs (SUTVA)\n")

stopifnot(
  !any(duplicated(est_data[, c("zip_id", "mo")])),
  all(est_data$g_mo == 0 | est_data$g_mo > min(est_data$mo)),
  sum(est_data$g_mo > 0) > 0
)

atts <- att_gt(
  yname         = "log_zhvi",
  tname         = "mo",
  idname        = "zip_id",
  gname         = "g_mo",
  xformla       = ~ log_pop + log_inc,
  data          = est_data,
  control_group = "notyettreated",
  # DEVIATION from the pre-registered est_method="dr", documented 2026-07-04:
  # most announcement cohorts contain a single treated ZIP, so the propensity
  # score inside the doubly-robust estimator cannot be fit and ~all ATT(g,t)
  # come back NA. The outcome-regression estimator keeps the covariate
  # adjustment and works with singleton cohorts; dr-without-covariates and
  # ipw variants are reported in the robustness table.
  est_method    = "reg",
  anticipation  = 3,
  clustervars   = "zip_id",
  base_period   = "universal",
  # ZHVI doesn't cover every ZIP back to 2012; forcing balance drops treated
  # cohorts entirely (did internal error). Keep the unbalanced panel instead.
  allow_unbalanced_panel = TRUE
)

dir.create("output/models", recursive = TRUE, showWarnings = FALSE)
saveRDS(atts, "output/models/att_gt.rds")  # save before aggregation so failures are debuggable

dyn <- aggte(atts, type = "dynamic", min_e = -24, max_e = 36, na.rm = TRUE)
simple <- aggte(atts, type = "simple", na.rm = TRUE)

saveRDS(dyn,    "output/models/aggte_dynamic.rds")
saveRDS(simple, "output/models/aggte_simple.rds")

# ---- results.json (merge; single source of truth for all reported numbers) ----
res_path <- "output/results.json"
results <- if (file.exists(res_path)) fromJSON(res_path, simplifyVector = FALSE) else list()
crit <- if (!is.null(dyn$crit.val.egt) && is.finite(dyn$crit.val.egt)) dyn$crit.val.egt else qnorm(0.975)
results$main <- list(
  spec            = "CS notyettreated reg anticipation=3 xformla=log_pop+log_inc universal base (dr infeasible: singleton cohorts)",
  att_simple      = simple$overall.att,
  se_simple       = simple$overall.se,
  ci_lo           = simple$overall.att - qnorm(0.975) * simple$overall.se,
  ci_hi           = simple$overall.att + qnorm(0.975) * simple$overall.se,
  n_treated_zips  = length(unique(est_data$zip_id[est_data$g_mo > 0])),
  n_control_zips  = length(unique(est_data$zip_id[est_data$g_mo == 0])),
  n_ring1_dropped = n_ring_dropped,
  # did's joint Wald (Wpval) is not returned on this unbalanced panel; report
  # the transparent pre-period summary from the dynamic path instead.
  pretrend_wald_p = tryCatch(
    if (is.null(atts$Wpval) || length(atts$Wpval) == 0) NA else atts$Wpval,
    error = function(e) NA
  )
)
writeLines(toJSON(results, auto_unbox = TRUE, pretty = TRUE, digits = 8, na = "null"), res_path)

# ---- event-study figure + data behind it (for Remotion) ----
es <- tibble(
  e   = dyn$egt,
  att = dyn$att.egt,
  se  = dyn$se.egt
) |>
  mutate(ci_lo = att - crit * se, ci_hi = att + crit * se,
         phase = if_else(e < 0, "pre", "post"))

pre <- es |> filter(e < 0, !is.na(att), !is.na(se))
results$main$pretrend_n <- nrow(pre)
results$main$pretrend_n_sig_5pct <- sum(abs(pre$att / pre$se) > qnorm(0.975))
results$main$pretrend_mean_att <- mean(pre$att)
writeLines(toJSON(results, auto_unbox = TRUE, pretty = TRUE, digits = 8, na = "null"), res_path)

dir.create("output/figs", recursive = TRUE, showWarnings = FALSE)
writeLines(toJSON(es, dataframe = "rows", pretty = TRUE, digits = 8, na = "null"),
           "output/figs/eventstudy.json")

p <- ggplot(es, aes(e, att, color = phase)) +
  geom_hline(yintercept = 0, linewidth = 0.3) +
  geom_vline(xintercept = -0.5, linetype = "dashed", linewidth = 0.3) +
  geom_pointrange(aes(ymin = ci_lo, ymax = ci_hi), fatten = 1.4) +
  scale_color_manual(values = c(pre = "grey45", post = "#c0392b"), guide = "none") +
  labs(
    x = "months since announcement (anticipation = 3)",
    y = "ATT on log ZHVI",
    title = "Do data-center announcements capitalize into GA home values?",
    subtitle = sprintf(
      "CS(2021) doubly-robust, not-yet-treated controls; %d treated ZIPs; 95%% uniform bands",
      results$main$n_treated_zips
    )
  ) +
  theme_minimal(base_size = 11)

ggsave("output/figs/eventstudy.pdf", p, width = 8, height = 4.8)
ggsave("output/figs/eventstudy.png", p, width = 8, height = 4.8, dpi = 160)

cat(sprintf(
  "estimation ok: ATT(simple) = %.4f (se %.4f), 95%% CI [%.4f, %.4f]\npre-trend Wald p = %s\n",
  results$main$att_simple, results$main$se_simple,
  results$main$ci_lo, results$main$ci_hi,
  format(results$main$pretrend_wald_p)
))
cat("REMINDER: inspect the pre-period path in output/figs/eventstudy.pdf before believing anything.\n")
