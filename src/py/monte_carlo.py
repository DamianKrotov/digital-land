"""P5 — ILLUSTRATIVE stranded-cost Monte Carlo (ARCHITECTURE §6 sidebar).

Stranded_$B = MW_certified x 1000 kW/MW x (1 - p_materialize) x capex_$/kW / 1e9

p_materialize ~ Beta calibrated to three labeled scenarios; capex ~ Uniform over
the EIA CCGT range. Parameters live in refs/mc_params.json and must carry
"verified": true (set by Damian after checking each number against the stored
source) — otherwise this script refuses to run. Output is labeled ILLUSTRATIVE:
it communicates risk asymmetry, it is not a causal estimate.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
PARAMS = ROOT / "refs" / "mc_params.json"
FIGS = ROOT / "output" / "figs"
RESULTS = ROOT / "output" / "results.json"

N_DRAWS = 10_000
BETA_CONCENTRATION = 30  # a+b; higher = tighter around scenario mean


def beta_ab(mean: float, k: float = BETA_CONCENTRATION) -> tuple[float, float]:
    return mean * k, (1 - mean) * k


def main() -> None:
    if not PARAMS.exists():
        sys.exit(f"{PARAMS} missing — create it with verified figures (see refs/sources.md)")
    p = json.loads(PARAMS.read_text())
    if p.get("verified") is not True:
        sys.exit(
            f"{PARAMS} has verified != true. Damian must check mw_certified, capex range,\n"
            "and scenario probabilities against the stored sources, then set verified: true."
        )

    rng = np.random.default_rng(51)
    mw = float(p["mw_certified"])
    capex_lo, capex_hi = float(p["capex_usd_per_kw_low"]), float(p["capex_usd_per_kw_high"])

    draws = {}
    for name, mean_p in p["scenarios"].items():
        a, b = beta_ab(float(mean_p))
        p_mat = rng.beta(a, b, N_DRAWS)
        capex = rng.uniform(capex_lo, capex_hi, N_DRAWS)
        draws[name] = mw * 1000 * (1 - p_mat) * capex / 1e9

    fig, ax = plt.subplots(figsize=(8, 4.5))
    order = sorted(draws, key=lambda k: np.median(draws[k]))
    stats = {}
    for i, name in enumerate(order):
        d = draws[name]
        q = np.percentile(d, [5, 25, 50, 75, 95])
        stats[name] = {
            "p_mean": p["scenarios"][name],
            "stranded_bn_p5": round(q[0], 2), "stranded_bn_p25": round(q[1], 2),
            "stranded_bn_median": round(q[2], 2),
            "stranded_bn_p75": round(q[3], 2), "stranded_bn_p95": round(q[4], 2),
        }
        ax.fill_betweenx([i - 0.3, i + 0.3], q[0], q[4], alpha=0.25, color="crimson")
        ax.fill_betweenx([i - 0.3, i + 0.3], q[1], q[3], alpha=0.45, color="crimson")
        ax.plot([q[2], q[2]], [i - 0.3, i + 0.3], color="black", lw=2)
    ax.set_yticks(range(len(order)))
    ax.set_yticklabels([f"{n} (p={p['scenarios'][n]})" for n in order])
    ax.set_xlabel("Potential stranded capacity cost, $ billions")
    ax.set_title(
        f"ILLUSTRATIVE: cost of certified-but-unmaterialized load\n"
        f"{mw:,.0f} MW certified x (1-p) x CCGT capex ${capex_lo:,.0f}-{capex_hi:,.0f}/kW "
        f"(10k draws, seed 51)"
    )
    FIGS.mkdir(parents=True, exist_ok=True)
    for ext in ("pdf", "png"):
        fig.savefig(FIGS / f"stranded_fan.{ext}", dpi=150, bbox_inches="tight")

    # echo params + stats into results.json (merge, never clobber other keys)
    results = json.loads(RESULTS.read_text()) if RESULTS.exists() else {}
    results["monte_carlo"] = {"params": p, "n_draws": N_DRAWS, "seed": 51, "scenarios": stats}
    RESULTS.parent.mkdir(parents=True, exist_ok=True)
    RESULTS.write_text(json.dumps(results, indent=1))
    # data behind the figure, for Remotion
    (FIGS / "stranded_fan.json").write_text(json.dumps(stats, indent=1))
    print(f"monte carlo ok -> {FIGS}/stranded_fan.* ; results.json updated")
    for n in order:
        print(f"  {n}: median ${stats[n]['stranded_bn_median']}B "
              f"[p5 {stats[n]['stranded_bn_p5']} – p95 {stats[n]['stranded_bn_p95']}]")


if __name__ == "__main__":
    main()
