# Methodology

This document describes how CommerceLens was built, end to end: data generation, validation, analysis, and
publication. The guiding rule throughout was **compute first, publish second** — no statistic appears on the
website that wasn't calculated from the generated dataset by the scripts described here.

## 1. Data generation

`data/generate_dataset.py` produces `data/commerce_sessions.csv` and `data/commerce_sessions.parquet` from
scratch, with a fixed random seed (`--seed 42`, default) so the dataset is fully reproducible.

The generator does not fill 60,000 independent random rows. It builds the data in layers so realistic
dependencies fall out of the model rather than being asserted after the fact:

1. **A finite customer population** (~20,000 customers for 60,000 sessions) is created first, each with latent
   traits — a "loyalty" trait, an income level, a baseline order-value multiplier. Sessions are then sampled from
   this population with probability weighted by loyalty, so returning/loyal customers naturally generate more
   sessions and behave differently from new customers — this is structural, not a per-row coin flip.
2. **Session behavior** (duration, pages viewed, products viewed, searches, add-to-cart, cart items) is derived
   from a single latent "engagement" score per session, which itself depends on the customer's traits, device,
   discount/campaign exposure, season, and weekday — so duration, pages, products viewed, and cart activity move
   together the way real sessions do, with independent noise layered on top.
3. **Purchase** is drawn from a logistic model combining add-to-cart, products viewed, session duration, customer
   loyalty, discount/campaign exposure, channel, season, device, and delivery delay — plus irreducible Gaussian
   noise in the logit — so purchase is *associated* with these signals without being deterministic.
4. **Order value, returns, satisfaction, and margin** are only generated for purchased sessions, each conditioned
   on category, income, items purchased, and discount — order value is drawn from a lognormal distribution (with
   a small additional heavy-tail component) to produce the right-skew a real order-value distribution shows.
5. **Derived fields** (`engagement_score`, `customer_total_spend`, `customer_value_segment`, etc.) are computed
   from the generated raw fields using transparent, documented rules — see `data/data_dictionary.csv` for the
   raw/derived flag on every column.

## 2. Validation

`data/validate_dataset.py` runs 33 automated checks against the generated CSV and writes
`data/validation_report.json`. Checks cover: row/column counts, duplicate IDs, categorical value validity,
non-negativity constraints, purchase-outcome coherence (e.g. `purchase=0 → order_value=0`), return-outcome
coherence (`returned=True → purchase=True`), cart/add-to-cart consistency, segment/previous-orders consistency,
date-range validity, and probability-scale bounds. All 33 checks pass on the current dataset.

## 3. Analysis

Nine Python modules under `analytics/` implement every statistical/probabilistic technique the site covers, as
pure, independently-testable functions (`analytics/tests/`, 60 pytest cases):

| Module | Covers |
|---|---|
| `descriptive.py` | mean, median, mode, range, percentiles, quartiles, IQR, outlier bounds, frequency tables |
| `association.py` | crosstabs, covariance, correlation, OLS fitted line, group means/rates |
| `probability.py` | union, intersection, complement, conditional probability, empirical independence check |
| `bayes.py` | Bayes' theorem, both as a direct formula and applied to Purchase/Cart |
| `combinatorics.py` | factorial, permutations, combinations, permutations with repetition, counting principle |
| `random_variables.py` | empirical PMF/CDF, Bernoulli, Binomial, Hypergeometric |
| `distributions.py` | Uniform, Triangular, Exponential (pdf/cdf/summary/memoryless check) |
| `campaign_sampling.py` | hypergeometric campaign-sampling wrapper with a naive binomial comparison |
| `customer_value.py` | revenue/orders/AOV/median/return-rate/margin/repeat-rate, by group |

`analytics/run_all.py` imports the real dataset, calls every module against it, and writes one consolidated
JSON payload (`analytics/output/analytics.json`, ~260 KB) — segment breakdowns, association statistics,
probability tables, distribution parameters, everything. This file is copied into the Next.js app
(`web/lib/data/analytics.json`) and is the **only** source of the numbers rendered on most pages.

## 4. Publication

The Next.js site (`web/`) is built around one rule: **UI components never compute statistics themselves for
data they didn't already receive computed.** Two layers make this possible:

- **Precomputed layer** (`web/lib/data.ts`): a fully-typed import of `analytics.json`, used for anything backed
  by the full 60,000-row dataset (dashboards, association charts, segment breakdowns).
- **Live layer** (`web/lib/analytics/*.ts`): TypeScript mirrors of the Python modules' pure math (binomial PMF,
  hypergeometric PMF, uniform/triangular/exponential distributions, combinatorics), used for interactive
  calculators where the user supplies "what-if" parameters (the Conversion Forecast Simulator, Campaign Sampling
  tool, Continuous Distribution Lab, Statistics Calculator). The Probability Engine and Independence Check pages
  go one step further: they decode a bit-packed array of five real per-session boolean events shipped in
  `analytics.json` and compute *any* probability the user asks for, live, from the real sample — not a fixed
  lookup table.
- **Server-side query layer** (`web/app/api/explore/*`): the Data Explorer never ships the full 60,000-row CSV to
  the browser. A Node route handler loads and caches the CSV once, applies the user's filters server-side, and
  returns only an aggregate summary, a numeric-column histogram, and a capped row preview.

## 5. Reproducing the whole pipeline

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python data/generate_dataset.py     # writes data/commerce_sessions.{csv,parquet}
python data/validate_dataset.py     # writes data/validation_report.json, exits non-zero on failure
python -m pytest analytics/tests/   # 60 unit tests
python -m analytics.run_all         # writes analytics/output/analytics.json

cp analytics/output/analytics.json web/lib/data/analytics.json
cp data/commerce_sessions.csv web/data/commerce_sessions.csv

cd web && npm install && npm run build
```
