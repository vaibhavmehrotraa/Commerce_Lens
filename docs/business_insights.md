# Business Insights

A summary of the headline, dynamically-computed findings from the current dataset. Every number below is pulled
from `analytics/output/analytics.json` — regenerate the dataset and this document's numbers would change
accordingly; they are not hand-typed. See [`limitations.md`](../web/app/limitations/page.tsx) (rendered on the
site at `/limitations`) before treating any of these as a real-world claim.

## Headline metrics (whole dataset)

| Metric | Value |
|---|---|
| Sessions | 60,000 |
| Unique customers | 20,284 |
| Conversion rate | 27.5% |
| Revenue | ₹7,74,09,571 |
| Average order value | ₹4,685 |
| Median order value | ₹1,350 |
| Return rate | 11.7% |
| Repeat customer rate | 85.4% |

Average order value is ~3.5× the median — a right-skewed order-value distribution, consistent with a
marketplace where most orders are modest but a minority of large orders pull the mean up.

## Behavioral associations with purchase

- **Add-to-cart is the strongest single signal**: P(Purchase | Add to Cart) = 55.0%, vs. a baseline P(Purchase)
  of 27.5% — roughly 2× the baseline rate.
- **Discount exposure** is associated with a higher purchase rate (33.5% vs. 22.3% for non-exposed sessions),
  and this gap does *not* collapse under an independence check — the observed P(Discount ∩ Purchase) departs
  from P(Discount)·P(Purchase) by a relative 21.8%, i.e. the two events are not behaving as if independent in
  this sample.
- **Device** shows a real but modest gap: Desktop converts at 30.4% vs. Mobile at 26.4% — a 4.0 percentage-point
  difference, not the dramatic-looking gap a truncated y-axis could imply (see `/misleading-charts`).
- **Customer segment** shows the widest spread: Loyal-segment sessions convert at roughly 39%, vs. ~20% for New
  customers — though segment is itself defined by historical order count, so this partly reflects existing
  tenure/trust rather than an independent lever.

## Bayes' theorem cross-check

P(Purchase | Cart) computed directly from the data (55.0%) and via Bayes' theorem from P(Cart | Purchase),
P(Purchase), and P(Cart) agree to within floating-point precision (absolute difference ≈ 0). This is expected —
Bayes' theorem is a mathematical identity, not new information — but it demonstrates the two computation paths
are consistent.

## Customer value

Revenue, AOV, and return rate all vary materially by customer segment, product category, acquisition channel,
income level, device, and season — see `/customer-value` for the full breakdown and box-plot distributions
(not just averages) by segment.

## What this does — and doesn't — support

Every finding above is an **observational, conditional relationship in a specific 60,000-session sample**. None
of it was produced by a randomized experiment, so none of it should be read as proof that changing one variable
(e.g. offering more discounts) would *cause* a change in another (e.g. more purchases). The `/decision-lab` page
on the site walks through five of these findings with an explicit statement of what business decision each
could inform, and what a decision-maker should know before acting on it — including plausible confounds like
self-selection into discount-seeking, or channel audiences differing in intent before they ever reach the site.
