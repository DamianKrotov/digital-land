"""P4(h) — gradient-boosted propensity scores to trim the control pool.

Framing per ARCHITECTURE §6: a robustness/trimming step, not identification
magic. Features are pre-period only. Output: output/trimmed_controls.csv
(control ZIPs retained) + an overlap plot. Consumed by src/r/04_robustness.R.
"""

from __future__ import annotations

from pathlib import Path

import lightgbm as lgb
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
PANEL = ROOT / "data" / "processed" / "panel.parquet"
OUT = ROOT / "output" / "trimmed_controls.csv"
FIGS = ROOT / "output" / "figs"

PRE_END_MO = (2019 - 2000) * 12  # features use months strictly before 2019-01


def main() -> None:
    panel = pd.read_parquet(PANEL)
    pre = panel[panel["mo"] < PRE_END_MO]
    assert len(pre), "no pre-2019 months in panel"

    feat = (
        pre.sort_values("mo")
        .groupby("zip")
        .agg(
            log_pop=("log_pop", "first"),
            log_inc=("log_inc", "first"),
            base_level=("log_zhvi", "mean"),
            base_first=("log_zhvi", "first"),
            base_last=("log_zhvi", "last"),
            ring1=("ring1", "first"),
            treated=("treated", "first"),
        )
    )
    feat["base_trend"] = feat["base_last"] - feat["base_first"]
    feat = feat.drop(columns=["base_first", "base_last"])
    pool = feat[~feat["ring1"] | (feat["treated"] == 1)]  # ring1 controls already excluded

    X = pool[["log_pop", "log_inc", "base_level", "base_trend"]]
    y = pool["treated"]
    clf = lgb.LGBMClassifier(
        n_estimators=100, learning_rate=0.05, num_leaves=7, min_child_samples=25,
        random_state=51, deterministic=True, force_row_wise=True, verbose=-1,
    )
    # out-of-fold scores: in-sample predict_proba memorizes n~500 rows and
    # produces degenerate 0/1 scores (a first run kept 8/466 controls)
    from sklearn.model_selection import StratifiedKFold, cross_val_predict

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=51)
    pscore = cross_val_predict(clf, X, y, cv=cv, method="predict_proba")[:, 1]
    pool = pool.assign(pscore=pscore)

    t = pool[pool["treated"] == 1]["pscore"]
    c = pool[pool["treated"] == 0]["pscore"]
    lo, hi = t.min(), t.max()  # keep controls on the treated support
    keep = pool[(pool["treated"] == 0) & pool["pscore"].between(lo, hi)]

    fig, ax = plt.subplots(figsize=(7, 4))
    bins = np.linspace(0, max(0.05, pool["pscore"].max()), 40)
    ax.hist(c, bins=bins, alpha=0.5, label=f"controls (n={len(c)})", density=True)
    ax.hist(t, bins=bins, alpha=0.5, label=f"treated (n={len(t)})", density=True)
    ax.axvline(lo, ls="--", c="k", lw=0.8)
    ax.axvline(hi, ls="--", c="k", lw=0.8)
    ax.set_xlabel("gradient-boosted propensity score (pre-period features only)")
    ax.set_title(f"Overlap: {len(keep)}/{len(c)} control ZIPs retained on treated support")
    ax.legend()
    FIGS.mkdir(parents=True, exist_ok=True)
    for ext in ("pdf", "png"):
        fig.savefig(FIGS / f"propensity_overlap.{ext}", dpi=150, bbox_inches="tight")

    keep.reset_index()[["zip", "pscore"]].to_csv(OUT, index=False)
    print(f"propensity trim ok -> {OUT}: kept {len(keep)}/{len(c)} controls "
          f"on treated support [{lo:.4f}, {hi:.4f}]")


if __name__ == "__main__":
    main()
