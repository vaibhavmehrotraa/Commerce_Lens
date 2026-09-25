"""
CommerceLens synthetic dataset generator.

Generates a session-level e-commerce dataset with realistic, intentional
statistical dependencies (not independent random noise). Every downstream
number shown on the CommerceLens website is calculated from the CSV/Parquet
this script produces -- nothing on the site is hard-coded.

Usage:
    python data/generate_dataset.py [--rows 60000] [--seed 42]

Outputs:
    data/commerce_sessions.csv
    data/commerce_sessions.parquet
"""

from __future__ import annotations

import argparse
import datetime as dt
import os

import numpy as np
import pandas as pd

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

DEFAULT_ROWS = 60_000
DEFAULT_SEED = 42

START_DATE = dt.date(2024, 1, 1)
END_DATE = dt.date(2025, 12, 31)

CATEGORIES = [
    "Fashion", "Electronics", "Home & Kitchen", "Beauty & Personal Care",
    "Grocery", "Mobiles", "Footwear", "Sports & Fitness", "Toys & Baby",
    "Books & Stationery",
]
CATEGORY_BASE_PRICE = {  # typical price-band center, INR
    "Fashion": 900, "Electronics": 6500, "Home & Kitchen": 1400,
    "Beauty & Personal Care": 650, "Grocery": 500, "Mobiles": 12000,
    "Footwear": 1100, "Sports & Fitness": 1300, "Toys & Baby": 800,
    "Books & Stationery": 400,
}
CATEGORY_RETURN_RATE = {  # baseline return propensity multiplier
    "Fashion": 1.6, "Electronics": 1.3, "Home & Kitchen": 0.9,
    "Beauty & Personal Care": 0.5, "Grocery": 0.2, "Mobiles": 1.1,
    "Footwear": 1.7, "Sports & Fitness": 0.8, "Toys & Baby": 0.7,
    "Books & Stationery": 0.3,
}

DEVICES = ["Mobile", "Desktop", "Tablet"]
DEVICE_P = [0.68, 0.25, 0.07]

CHANNELS = ["Organic Search", "Paid Search", "Social Media", "Email", "Direct", "Affiliate"]
CHANNEL_P = [0.22, 0.20, 0.18, 0.12, 0.18, 0.10]
# behavioral multiplier on purchase propensity by channel (email/direct = higher intent)
CHANNEL_INTENT = {
    "Organic Search": 0.05, "Paid Search": -0.05, "Social Media": -0.15,
    "Email": 0.25, "Direct": 0.30, "Affiliate": -0.10,
}

GENDERS = ["Female", "Male", "Other"]
GENDER_P = [0.47, 0.50, 0.03]

INCOME_LEVELS = ["Low", "Lower-Middle", "Upper-Middle", "High"]
INCOME_P = [0.20, 0.35, 0.30, 0.15]
INCOME_SPEND_MULT = {"Low": 0.6, "Lower-Middle": 0.85, "Upper-Middle": 1.2, "High": 1.9}

CITY_TIERS = ["Tier 1", "Tier 2", "Tier 3"]
CITY_TIER_P = [0.38, 0.37, 0.25]

PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "Cash on Delivery", "Wallet", "Net Banking"]
PAYMENT_P = [0.34, 0.16, 0.16, 0.18, 0.10, 0.06]

PRICE_BANDS = ["Budget", "Value", "Premium", "Luxury"]

CAMPAIGN_TYPES = ["Flash Sale", "Seasonal Sale", "Clearance", "New Launch", "Loyalty Reward"]
OFFER_TYPES = ["Percentage Off", "Flat Amount Off", "Buy One Get One", "Free Gift", "Cashback"]

SEASON_BY_MONTH = {
    1: "Winter Sale", 2: "Winter Sale", 3: "Spring", 4: "Spring", 5: "Summer",
    6: "Summer", 7: "Monsoon", 8: "Monsoon", 9: "Festive Lead-in",
    10: "Festive Season", 11: "Festive Season", 12: "Winter Sale",
}
SEASON_INTENT = {
    "Winter Sale": 0.10, "Spring": -0.05, "Summer": -0.10, "Monsoon": -0.15,
    "Festive Lead-in": 0.15, "Festive Season": 0.35,
}

CUSTOMER_SEGMENTS = ["New", "Occasional", "Regular", "Loyal"]


def sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate the CommerceLens synthetic session dataset.")
    parser.add_argument("--rows", type=int, default=DEFAULT_ROWS)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--out-dir", type=str, default=os.path.dirname(os.path.abspath(__file__)))
    args = parser.parse_args()

    n = args.rows
    rng = np.random.default_rng(args.seed)

    # ----------------------------------------------------------------
    # 1. Customer population. Sessions are drawn from a finite pool of
    #    customers so that "previous_orders", "customer_total_spend" etc.
    #    can be genuinely longitudinal rather than per-session fabrications.
    # ----------------------------------------------------------------
    n_customers = max(1, int(n * 0.42))  # customers return for multiple sessions
    customer_ids = np.array([f"CUST{100000 + i}" for i in range(n_customers)])

    customer_age = np.clip(rng.normal(33, 10, n_customers), 18, 70).astype(int)
    customer_gender = rng.choice(GENDERS, n_customers, p=GENDER_P)
    customer_income = rng.choice(INCOME_LEVELS, n_customers, p=INCOME_P)
    customer_city_tier = rng.choice(CITY_TIERS, n_customers, p=CITY_TIER_P)
    customer_primary_device = rng.choice(DEVICES, n_customers, p=DEVICE_P)
    customer_channel = rng.choice(CHANNELS, n_customers, p=CHANNEL_P)

    # customer "loyalty propensity" - latent trait driving how often they
    # return and how they behave; income skews this up, purely as tendency.
    income_rank = pd.Series(customer_income).map({"Low": 0, "Lower-Middle": 1, "Upper-Middle": 2, "High": 3}).to_numpy()
    loyalty_latent = rng.normal(0, 1, n_customers) + 0.25 * income_rank
    # number of historical (pre-window) orders per customer, zero-inflated negative-binomial-ish via gamma-poisson
    hist_orders_lambda = np.clip(np.exp(0.35 * loyalty_latent + 0.5), 0.05, 40)
    customer_hist_orders = rng.poisson(hist_orders_lambda)

    customer_segment = np.where(
        customer_hist_orders == 0, "New",
        np.where(customer_hist_orders < 3, "Occasional",
                 np.where(customer_hist_orders < 8, "Regular", "Loyal")),
    )

    # baseline customer purchase propensity (latent), used later for session purchase prob
    cust_propensity = (
        0.30 * loyalty_latent
        + 0.15 * income_rank
        + rng.normal(0, 0.6, n_customers)
    )

    # average historical order value baseline per customer (income + some randomness)
    cust_aov_baseline = (
        900 * np.array([INCOME_SPEND_MULT[i] for i in customer_income])
        * np.exp(rng.normal(0, 0.35, n_customers))
    )

    customers = pd.DataFrame({
        "customer_id": customer_ids,
        "customer_age": customer_age,
        "gender": customer_gender,
        "income_level": customer_income,
        "city_tier": customer_city_tier,
        "_primary_device": customer_primary_device,
        "acquisition_channel": customer_channel,
        "customer_segment": customer_segment,
        "previous_orders": customer_hist_orders,
        "_propensity": cust_propensity,
        "_aov_baseline": cust_aov_baseline,
        "_loyalty_latent": loyalty_latent,
    })

    # ----------------------------------------------------------------
    # 2. Sample n sessions from the customer pool. Higher-loyalty / more
    #    frequent customers generate proportionally more sessions, which is
    #    how "returning customers behave differently" becomes structural
    #    rather than a per-row coin flip.
    # ----------------------------------------------------------------
    session_weight = np.exp(0.65 * customers["_loyalty_latent"].to_numpy())
    session_weight = session_weight / session_weight.sum()
    chosen_idx = rng.choice(n_customers, size=n, p=session_weight, replace=True)
    sess = customers.iloc[chosen_idx].reset_index(drop=True).copy()

    # ----------------------------------------------------------------
    # 3. Temporal fields
    # ----------------------------------------------------------------
    date_range_days = (END_DATE - START_DATE).days
    day_offsets = rng.integers(0, date_range_days + 1, n)
    session_dates = np.array([START_DATE + dt.timedelta(days=int(d)) for d in day_offsets])
    sess["session_date"] = pd.to_datetime(session_dates)
    sess["day_of_week"] = sess["session_date"].dt.day_name()
    weekend_boost = sess["day_of_week"].isin(["Saturday", "Sunday"]).to_numpy() * 0.10

    # hour of day: bimodal (lunch + evening), heavier evening mass
    hour_component = rng.choice([0, 1], size=n, p=[0.35, 0.65])
    hours = np.where(
        hour_component == 0,
        np.clip(rng.normal(13, 2, n), 0, 23),
        np.clip(rng.normal(20, 2.2, n), 0, 23),
    ).astype(int)
    sess["hour"] = hours

    sess["season"] = sess["session_date"].dt.month.map(SEASON_BY_MONTH)
    season_intent = sess["season"].map(SEASON_INTENT).to_numpy()

    # ----------------------------------------------------------------
    # 4. days_since_last_order -- exponential-ish, shorter for loyal segment
    # ----------------------------------------------------------------
    rate_by_segment = sess["customer_segment"].map(
        {"New": 1 / 400, "Occasional": 1 / 120, "Regular": 1 / 45, "Loyal": 1 / 18}
    ).to_numpy()
    dsl = rng.exponential(1 / rate_by_segment)
    sess["days_since_last_order"] = np.where(
        sess["customer_segment"] == "New", np.nan, np.round(np.clip(dsl, 0, 900), 0)
    )

    # ----------------------------------------------------------------
    # 5. Device for this session (mostly primary device, some switching)
    # ----------------------------------------------------------------
    switch = rng.random(n) < 0.12
    random_device = rng.choice(DEVICES, n, p=DEVICE_P)
    sess["device"] = np.where(switch, random_device, sess["_primary_device"])

    # ----------------------------------------------------------------
    # 6. Marketing exposure
    # ----------------------------------------------------------------
    campaign_base_p = 0.42 + 0.10 * (sess["season"] == "Festive Season").to_numpy()
    sess["campaign_exposed"] = rng.random(n) < np.clip(campaign_base_p, 0, 0.85)
    sess["campaign_type"] = np.where(
        sess["campaign_exposed"], rng.choice(CAMPAIGN_TYPES, n), "None"
    )
    sess["offer_type"] = np.where(
        sess["campaign_exposed"], rng.choice(OFFER_TYPES, n), "None"
    )

    discount_p = np.clip(0.30 + 0.35 * sess["campaign_exposed"].to_numpy().astype(float) + 0.08 * (sess["income_level"] == "Low").to_numpy(), 0.05, 0.92)
    sess["discount_exposed"] = rng.random(n) < discount_p
    sess["discount_pct"] = np.where(
        sess["discount_exposed"],
        np.round(np.clip(rng.gamma(3.0, 6.0, n), 5, 70), 0),
        0,
    )
    sess["offer_value"] = np.where(
        sess["campaign_exposed"],
        np.round(np.clip(rng.gamma(2.2, 90, n), 20, 2000), 0),
        0,
    )
    sess["free_shipping"] = rng.random(n) < np.clip(0.25 + 0.25 * sess["discount_exposed"].to_numpy(), 0, 0.9)

    # ----------------------------------------------------------------
    # 7. Session engagement behavior. Build a single latent "engagement"
    #    driver so duration / pages / products / searches / cart move
    #    together the way real sessions do, then layer purchase on top.
    # ----------------------------------------------------------------
    device_engagement = sess["device"].map({"Desktop": 0.20, "Tablet": 0.05, "Mobile": -0.05}).to_numpy()
    engagement_latent = (
        0.55 * sess["_propensity"].to_numpy()
        + 0.25 * sess["discount_exposed"].to_numpy().astype(float)
        + 0.15 * sess["campaign_exposed"].to_numpy().astype(float)
        + device_engagement
        + 0.20 * season_intent
        + weekend_boost
        + rng.normal(0, 0.8, n)
    )

    session_duration = np.exp(1.35 + 0.30 * engagement_latent + rng.normal(0, 0.45, n))
    sess["session_duration_min"] = np.round(np.clip(session_duration, 0.3, 90), 2)

    pages_lambda = np.clip(np.exp(1.15 + 0.28 * engagement_latent + 0.15 * np.log1p(sess["session_duration_min"])), 1, 60)
    sess["pages_viewed"] = rng.poisson(pages_lambda)
    sess["pages_viewed"] = np.clip(sess["pages_viewed"], 1, None)

    products_ratio = np.clip(sigmoid(0.5 * engagement_latent) * 0.75 + 0.05, 0.05, 0.95)
    sess["products_viewed"] = np.clip(
        rng.binomial(sess["pages_viewed"].to_numpy(), products_ratio), 0, None
    )

    searches_lambda = np.clip(np.exp(0.4 + 0.22 * engagement_latent), 0, 15)
    sess["searches"] = rng.poisson(searches_lambda)

    wishlist_p = np.clip(sigmoid(-1.6 + 0.35 * engagement_latent), 0.01, 0.6)
    sess["wishlist_added"] = rng.random(n) < wishlist_p

    # add_to_cart depends strongly on products_viewed + engagement
    atc_logit = (
        -2.2
        + 0.55 * np.log1p(sess["products_viewed"].to_numpy())
        + 0.55 * engagement_latent
        + 0.20 * sess["discount_exposed"].to_numpy().astype(float)
    )
    add_to_cart_p = np.clip(sigmoid(atc_logit), 0.01, 0.97)
    sess["add_to_cart"] = rng.random(n) < add_to_cart_p

    cart_items_lambda = np.clip(np.exp(0.3 + 0.25 * engagement_latent), 0.3, 12)
    sess["cart_items"] = np.where(
        sess["add_to_cart"], np.clip(rng.poisson(cart_items_lambda), 1, None), 0
    )

    # ----------------------------------------------------------------
    # 8. Category / price band / delivery / payment for the session
    # ----------------------------------------------------------------
    sess["category"] = rng.choice(CATEGORIES, n)
    base_price = sess["category"].map(CATEGORY_BASE_PRICE).to_numpy()
    price_mult = np.exp(rng.normal(0, 0.5, n)) * np.array([INCOME_SPEND_MULT[i] for i in sess["income_level"]])
    item_price = base_price * price_mult
    sess["price_band"] = pd.cut(
        item_price,
        bins=[-np.inf, base_price.mean() * 0.5, base_price.mean() * 1.1, base_price.mean() * 2.2, np.inf],
        labels=PRICE_BANDS,
    ).astype(str)

    sess["payment_method"] = rng.choice(PAYMENT_METHODS, n, p=PAYMENT_P)
    sess["estimated_delivery_days"] = np.clip(rng.triangular(1, 3, 9, n).round(0), 1, 15).astype(int)
    delay_p = np.clip(0.18 + 0.05 * (sess["city_tier"] == "Tier 3").to_numpy(), 0, 0.6)
    has_delay = rng.random(n) < delay_p
    sess["delivery_delay_days"] = np.where(has_delay, rng.poisson(2.2, n) + 1, 0)

    sess["customer_rating_history"] = np.round(np.clip(rng.normal(4.1, 0.6, n), 1, 5), 1)

    # ----------------------------------------------------------------
    # 9. PURCHASE -- the central outcome. Logistic model combining every
    #    behavioral + marketing + demographic signal, with irreducible
    #    noise so nothing is deterministic.
    # ----------------------------------------------------------------
    returning_flag = (sess["customer_segment"] != "New").to_numpy().astype(float)
    mobile_flag = (sess["device"] == "Mobile").to_numpy().astype(float)

    purchase_logit = (
        -3.6
        + 1.85 * sess["add_to_cart"].to_numpy().astype(float)
        + 0.30 * np.log1p(sess["products_viewed"].to_numpy())
        + 0.22 * np.log1p(sess["session_duration_min"].to_numpy())
        + 0.70 * sess["_propensity"].to_numpy()
        + 0.35 * returning_flag
        + 0.55 * sess["discount_exposed"].to_numpy().astype(float) * (1 - 0.35 * sess["add_to_cart"].to_numpy().astype(float))
        + 0.18 * sess["campaign_exposed"].to_numpy().astype(float)
        + 0.10 * income_rank_lookup(sess["income_level"].to_numpy())
        + 0.30 * season_intent
        + CHANNEL_INTENT_lookup(sess["acquisition_channel"].to_numpy())
        - 0.12 * mobile_flag
        - 0.05 * np.log1p(sess["delivery_delay_days"].to_numpy())
        + rng.normal(0, 0.65, n)  # irreducible noise
    )
    purchase_p = sigmoid(purchase_logit)
    sess["purchase"] = rng.random(n) < purchase_p

    # ----------------------------------------------------------------
    # 10. items_purchased (discrete RV X), order_value (right-skewed),
    #     returns, satisfaction, margin -- all conditioned on purchase.
    # ----------------------------------------------------------------
    n_purch = int(sess["purchase"].sum())
    items_lambda = np.clip(1.0 + 0.6 * np.log1p(sess.loc[sess["purchase"], "cart_items"].to_numpy()), 1, 8)
    items_purchased = rng.poisson(items_lambda)
    items_purchased = np.clip(items_purchased, 1, None)

    sess["items_purchased"] = 0
    sess.loc[sess["purchase"], "items_purchased"] = items_purchased

    # order value: lognormal driven by category base price, income, items, discount
    purch_idx = sess.index[sess["purchase"]]
    cat_price = sess.loc[purch_idx, "category"].map(CATEGORY_BASE_PRICE).to_numpy()
    income_mult = sess.loc[purch_idx, "income_level"].map(INCOME_SPEND_MULT).to_numpy()
    disc_mult = 1 - 0.5 * (sess.loc[purch_idx, "discount_pct"].to_numpy() / 100.0)
    mu = np.log(np.clip(cat_price * income_mult * sess.loc[purch_idx, "items_purchased"].to_numpy() * disc_mult, 50, None))
    order_value = rng.lognormal(mean=mu - 0.15, sigma=0.50)
    # inject a small tail of legitimately large orders (bulk / premium buys)
    tail_boost = rng.random(len(order_value)) < 0.012
    order_value = np.where(tail_boost, order_value * rng.uniform(2, 4, len(order_value)), order_value)

    sess["order_value"] = 0.0
    sess.loc[purch_idx, "order_value"] = np.round(np.clip(order_value, 49, None), 2)

    # returns: only possible when purchased; category + fit-risk driven
    cat_return_mult = sess.loc[purch_idx, "category"].map(CATEGORY_RETURN_RATE).to_numpy()
    return_logit = (
        -2.3
        + 0.55 * (cat_return_mult - 1.0)
        + 0.30 * (sess.loc[purch_idx, "income_level"] == "Low").to_numpy().astype(float)
        + 0.20 * (sess.loc[purch_idx, "device"] == "Mobile").to_numpy().astype(float)
        - 0.15 * (sess.loc[purch_idx, "customer_segment"] == "Loyal").to_numpy().astype(float)
        + rng.normal(0, 0.5, len(purch_idx))
    )
    return_p = sigmoid(return_logit)
    returned = rng.random(len(purch_idx)) < return_p
    sess["returned"] = False
    sess.loc[purch_idx, "returned"] = returned

    return_days = np.where(returned, rng.integers(1, 16, len(purch_idx)), 0)
    sess["return_days"] = 0
    sess.loc[purch_idx, "return_days"] = return_days

    # customer satisfaction: higher for on-time delivery, lower for returns/delay
    sat_base = rng.normal(4.0, 0.7, len(purch_idx))
    sat = sat_base - 0.9 * returned.astype(float) - 0.12 * np.log1p(sess.loc[purch_idx, "delivery_delay_days"].to_numpy())
    sess["customer_satisfaction"] = np.nan
    sess.loc[purch_idx, "customer_satisfaction"] = np.round(np.clip(sat, 1, 5), 1)

    margin_base = 100 - sess.loc[purch_idx, "discount_pct"].to_numpy() * 0.6
    margin = np.clip(margin_base * rng.uniform(0.12, 0.30, len(purch_idx)), 3, 45)
    margin = np.where(returned, margin - rng.uniform(5, 15, len(purch_idx)), margin)
    sess["profit_margin_pct"] = np.nan
    sess.loc[purch_idx, "profit_margin_pct"] = np.round(np.clip(margin, -20, 45), 2)

    # ----------------------------------------------------------------
    # 11. Identifiers
    # ----------------------------------------------------------------
    sess.insert(0, "session_id", [f"SESS{1000000 + i}" for i in range(n)])
    sess = sess.rename(columns={"customer_id": "customer_id"})

    # ----------------------------------------------------------------
    # 12. Derived analytical fields
    # ----------------------------------------------------------------
    sess["repeat_customer"] = sess["customer_segment"] != "New"
    sess["high_intent_session"] = (
        (sess["products_viewed"] >= sess["products_viewed"].quantile(0.75))
        & (sess["add_to_cart"])
        & (sess["session_duration_min"] >= sess["session_duration_min"].median())
    )
    engagement_score = (
        0.30 * minmax(sess["session_duration_min"])
        + 0.25 * minmax(sess["products_viewed"])
        + 0.20 * minmax(sess["pages_viewed"])
        + 0.15 * minmax(sess["searches"])
        + 0.10 * sess["add_to_cart"].astype(float)
    )
    sess["engagement_score"] = np.round(engagement_score * 100, 1)

    sess["discount_dependency"] = np.round(
        np.clip(
            0.5 * sess["discount_exposed"].astype(float)
            + 0.5 * (sess["discount_pct"] / sess["discount_pct"].replace(0, np.nan).max()).fillna(0),
            0, 1,
        ), 3,
    )
    sess["cart_conversion"] = np.where(sess["add_to_cart"], sess["purchase"].astype(float), np.nan)

    cust_group = sess.groupby("customer_id")
    sess["customer_total_spend"] = sess["customer_id"].map(cust_group["order_value"].transform("sum"))
    # transform already aligned; recompute cleanly:
    total_spend = sess.groupby("customer_id")["order_value"].transform("sum")
    sess["customer_total_spend"] = np.round(total_spend, 2)
    order_count = sess.groupby("customer_id")["purchase"].transform("sum")
    sess["customer_avg_order_value"] = np.round(np.where(order_count > 0, total_spend / order_count.replace(0, np.nan), 0), 2)
    returns_count = sess.groupby("customer_id")["returned"].transform("sum")
    sess["customer_return_rate"] = np.round(np.where(order_count > 0, returns_count / order_count.replace(0, np.nan), 0), 3)

    spend_q75 = sess["customer_total_spend"].quantile(0.75)
    spend_q40 = sess["customer_total_spend"].quantile(0.40)
    sess["customer_value_segment"] = np.select(
        [sess["customer_total_spend"] >= spend_q75,
         sess["customer_total_spend"] >= spend_q40,
         sess["customer_total_spend"] > 0],
        ["High Value", "Mid Value", "Low Value"],
        default="No Purchase Yet",
    )

    sess["time_since_previous_purchase_days"] = sess["days_since_last_order"]
    # next_purchase_days: synthetic exponential draw conditioned on segment rate (for waiting-time modeling section)
    seg_rate = sess["customer_segment"].map({"New": 1 / 90, "Occasional": 1 / 45, "Regular": 1 / 21, "Loyal": 1 / 10}).to_numpy()
    sess["next_purchase_days"] = np.round(rng.exponential(1 / seg_rate), 1)

    # drop internal helper columns
    sess = sess.drop(columns=[c for c in sess.columns if c.startswith("_")])

    # ----------------------------------------------------------------
    # 13. Column ordering per spec
    # ----------------------------------------------------------------
    column_order = [
        "session_id", "customer_id",
        "session_date", "day_of_week", "hour", "season",
        "customer_age", "gender", "income_level", "city_tier",
        "device",
        "acquisition_channel", "customer_segment",
        "previous_orders", "days_since_last_order",
        "session_duration_min", "pages_viewed", "products_viewed", "searches",
        "add_to_cart", "cart_items", "wishlist_added",
        "discount_exposed", "discount_pct", "free_shipping", "campaign_exposed", "campaign_type", "offer_type", "offer_value",
        "estimated_delivery_days", "delivery_delay_days",
        "customer_rating_history", "payment_method", "category", "price_band",
        "items_purchased", "purchase", "order_value", "returned", "return_days", "customer_satisfaction", "profit_margin_pct",
        "repeat_customer", "high_intent_session", "engagement_score", "discount_dependency", "cart_conversion",
        "customer_total_spend", "customer_avg_order_value", "customer_return_rate", "customer_value_segment",
        "time_since_previous_purchase_days", "next_purchase_days",
    ]
    sess = sess[column_order]

    # dtype cleanup
    bool_cols = ["add_to_cart", "wishlist_added", "discount_exposed", "free_shipping",
                 "campaign_exposed", "purchase", "returned", "repeat_customer", "high_intent_session"]
    for c in bool_cols:
        sess[c] = sess[c].astype(bool)
    sess["session_date"] = sess["session_date"].dt.strftime("%Y-%m-%d")

    out_dir = args.out_dir
    os.makedirs(out_dir, exist_ok=True)
    csv_path = os.path.join(out_dir, "commerce_sessions.csv")
    parquet_path = os.path.join(out_dir, "commerce_sessions.parquet")
    sess.to_csv(csv_path, index=False)
    sess.to_parquet(parquet_path, index=False)

    print(f"Generated {len(sess):,} rows x {len(sess.columns)} columns")
    print(f"Customers: {sess['customer_id'].nunique():,}")
    print(f"Conversion rate: {sess['purchase'].mean():.4f}")
    print(f"Wrote {csv_path}")
    print(f"Wrote {parquet_path}")


def minmax(s: pd.Series) -> pd.Series:
    lo, hi = s.min(), s.max()
    if hi == lo:
        return s * 0
    return (s - lo) / (hi - lo)


def income_rank_lookup(arr: np.ndarray) -> np.ndarray:
    m = {"Low": 0, "Lower-Middle": 1, "Upper-Middle": 2, "High": 3}
    return np.array([m[v] for v in arr], dtype=float)


def CHANNEL_INTENT_lookup(arr: np.ndarray) -> np.ndarray:
    return np.array([CHANNEL_INTENT[v] for v in arr], dtype=float)


if __name__ == "__main__":
    main()
