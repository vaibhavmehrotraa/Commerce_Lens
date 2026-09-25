Most analytics projects stop at dashboards.

I wanted to build one that could answer a harder question: what happens when you treat customer behavior as a probability problem instead of a reporting problem?

So I built CommerceLens — an analytics product on top of 60,000 synthetic e-commerce sessions, designed to walk the full path most dashboards skip:

Data → customer behavior → statistical description → association → probability → uncertainty → business decision.

A few of the questions it's built to answer:

→ What's the probability a session converts, and how does that change once you condition on an add-to-cart event? (Conditional probability, then cross-checked two independent ways with Bayes' theorem — they agree, because Bayes isn't new information, it's a restatement of the same conditional relationship.)

→ Are discount exposure and purchase actually behaving independently in this sample, or does knowing one tell you something about the other? (Empirical independence check: P(A∩B) vs. P(A)·P(B) — spoiler, they diverge.)

→ If I forecast conversions across the next 500 sessions, what's the full distribution of outcomes, not just the point estimate? (Binomial model, with its assumptions stated explicitly — because real traffic doesn't perfectly satisfy "independent, identically distributed.")

→ If I sample 40 customers from a finite campaign pool of 500 without replacement, what's the chance I land enough high-value customers? (Hypergeometric — and a side-by-side with the naive binomial approximation to show exactly where and why it breaks down.)

→ Two customer segments can have a similar average order value and a very different spread around it. Mean alone hides that. Variance is what tells the real risk/predictability story.

Under the hood: descriptive statistics (percentiles, IQR, Tukey outlier fences), correlation and covariance with explicit "association ≠ causation" framing on every chart, permutations and combinations applied to campaign design, random variables with real PMFs and CDFs, expected value, variance and standard deviation side by side, Bernoulli/Binomial trials, the Hypergeometric distribution, and a Continuous Distribution Lab covering Uniform, Triangular, and Exponential models — each one tied to a specific business scenario, not a stats-textbook exercise bolted onto the front page.

Every number on the site is computed live from the dataset — there's a Python analytics layer (pandas/numpy/scipy, 60 unit tests) that runs the real math once, and a parallel TypeScript layer so the interactive calculators respond instantly to whatever you type in.

The dataset is fully synthetic, generated with a reproducible, seeded script — I built it to have realistic, intentional statistical structure (add-to-cart genuinely raises purchase probability, order value is genuinely right-skewed) specifically so the analytical *method* could be demonstrated end to end. It isn't a claim about a real marketplace, and the site says so directly, more than once.

Built to bridge the gap between learning statistics and using statistics to make business decisions.

#DataAnalytics #Statistics #Probability #ProductAnalytics #DataScience #BusinessIntelligence #Python
