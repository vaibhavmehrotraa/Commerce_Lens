# Statistics & Probability Coverage

Every concept below is implemented as a tested function (`analytics/*.py` + `web/lib/analytics/*.ts`), applied to
the real dataset, and explained on the site at three levels: **Simple** (stakeholder), **Mathematical**
(formula), **Applied** (how it was actually used here). This page indexes where each concept lives.

## Descriptive statistics — [`/descriptive`](../web/app/descriptive/page.tsx)
Mean, median, mode, range, percentiles, quartiles, IQR, Tukey outlier fences, frequency distributions and
proportions — applied to order value and to nine numeric session-behavior fields, plus categorical frequency
tables for segment, income, device, category, and more.

## Association — [`/association`](../web/app/association/page.tsx)
Categorical × categorical (device/income/discount/segment/channel/campaign × purchase, as relative purchase
rates), numerical × numerical (session duration × products viewed, products viewed × order value, previous
orders × customer lifetime spend — each with covariance, Pearson correlation, and an OLS fitted line), and
categorical × numerical (category × device relative frequency). Every block explicitly distinguishes association
from causation.

## How Charts Can Mislead — [`/misleading-charts`](../web/app/misleading-charts/page.tsx)
Three paired, real-data examples: a truncated y-axis, inappropriate aggregation (raw totals vs. per-session
rate), and a cherry-picked two-point comparison vs. the full time series.

## Probability Engine — [`/probability`](../web/app/probability/page.tsx)
P(A), P(Aᶜ), P(A∩B), P(A∪B), P(A|B) for five named business events (Purchase, Add to Cart, Discount Exposure,
Returning Customer, Mobile User), computed live from a bit-packed record of the real per-session booleans via an
interactive "build your own probability" tool.

## Bayes' Theorem — [`/bayes`](../web/app/bayes/page.tsx)
P(Purchase | Cart) derived two ways — a direct empirical conditional probability, and via Bayes' theorem from
P(Cart | Purchase), P(Purchase), and P(Cart) — shown to agree, with an explanation of why.

## Independence Check — [`/independence`](../web/app/independence/page.tsx)
P(A∩B) vs. P(A)·P(B) for discount×purchase, mobile×purchase, and returning×purchase, plus a live checker for any
pair of the five named events. Explicitly framed as an empirical comparison, not a formal independence test.

## Campaign & Recommendation Combinatorics — [`/combinatorics`](../web/app/combinatorics/page.tsx)
Factorials, permutations (order matters — campaign offer assignment), combinations (order doesn't matter —
choosing a customer sample, designing a product bundle), and permutations with repetition (arranging a campaign
slot rotation with repeated offer types).

## Random Variables — [`/random-variables`](../web/app/random-variables/page.tsx)
X = items purchased as a discrete random variable: empirical PMF and CDF, expected value, variance, and standard
deviation — plus a side-by-side segment comparison showing two groups can share a similar mean but differ sharply
in variability — and Bernoulli framing of a single session's purchase outcome.

## Conversion Forecast Simulator (Binomial) — [`/binomial`](../web/app/binomial/page.tsx)
P(X=k), P(X≤k), P(X≥k), E[X]=np, Var(X)=np(1−p) for n future sessions at conversion probability p, both
interactive. States the four binomial assumptions explicitly and flags where real traffic can violate them.

## Campaign Sampling Without Replacement (Hypergeometric) — [`/hypergeometric`](../web/app/hypergeometric/page.tsx)
P(X=k) for drawing exactly k high-value customers in a sample of n from a finite pool of N (K high-value), with
a live side-by-side naive-binomial comparison explaining why sampling without replacement needs the
hypergeometric model.

## Continuous Distribution Lab — [`/distributions`](../web/app/distributions/page.tsx)
Uniform (bounded promo-window arrival time), Triangular (delivery-time uncertainty from min/mode/max estimates),
and Exponential (time between purchases, including a live memoryless-property demonstration) — each clearly
labeled a **Model Simulation**.

## Customer Segmentation — [`/segmentation`](../web/app/segmentation/page.tsx)
Transparent, rule-based segments (not black-box ML): `customer_segment` from historical order count,
`customer_value_segment` from spend quartiles — both rules stated in full on the page.

## Customer Value Analysis — [`/customer-value`](../web/app/customer-value/page.tsx)
Revenue, orders, AOV, median order value, return rate, profit margin, and repeat-purchase rate, broken down by
segment, category, channel, income, device, and season — plus an order-value box plot by segment so the
dashboard shows distributions, not just averages.

## Decision Lab — [`/decision-lab`](../web/app/decision-lab/page.tsx)
Five real findings, each run through: what did we observe → what statistical concept supports it → what does it
mean → what decision could it inform → what should a decision-maker know before acting on it.

## Interactive Statistics Calculator — [`/calculator`](../web/app/calculator/page.tsx)
Reusable, general-purpose calculators for mean/median/mode/range/percentiles/quartiles/IQR/variance/SD (any
pasted list), covariance/correlation (any two lists), conditional probability (from raw counts), and expected
value (from a user-built PMF) — each showing formula → input → calculation → result → business interpretation.
