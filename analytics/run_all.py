"""
Runs every analytics module against the real CommerceLens dataset and
writes one consolidated JSON payload that the Next.js site imports at
build/serve time. This is the ONLY place allowed to produce the numbers
shown on the website -- nothing in the frontend should hard-code a stat.

Usage:
    python analytics/run_all.py
"""

from __future__ import annotations

import base64
import json
import os

import numpy as np
import pandas as pd

from analytics import (
    association,
    bayes,
    campaign_sampling,
    combinatorics,
    customer_value,
    descriptive,
    distributions,
    probability,
    random_variables,
)

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_CSV = os.path.join(HERE, "..", "data", "commerce_sessions.csv")
OUT_DIR = os.path.join(HERE, "output")
OUT_PATH = os.path.join(OUT_DIR, "analytics.json")


def jsafe(obj):
    """Recursively convert numpy/pandas scalars to plain python for json.dump."""
    if isinstance(obj, dict):
        return {str(k): jsafe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [jsafe(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        v = float(obj)
        return None if np.isnan(v) else v
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, float) and np.isnan(obj):
        return None
    return obj


def main() -> None:
    df = pd.read_csv(DATA_CSV, parse_dates=["session_date"])
    payload: dict = {}

    # ==================================================================
    # 0. Executive summary / homepage metrics
    # ==================================================================
    vm = customer_value.value_metrics(df)
    payload["executive_summary"] = vm

    # Purchase funnel
    funnel = {
        "sessions": int(len(df)),
        "viewed_products": int((df["products_viewed"] > 0).sum()),
        "added_to_cart": int(df["add_to_cart"].sum()),
        "purchased": int(df["purchase"].sum()),
    }
    payload["funnel"] = funnel

    payload["segment_distribution"] = descriptive.frequency_table(df["customer_segment"])
    payload["conversion_by_segment"] = association.rate_by_group(df["customer_segment"], df["purchase"])
    payload["value_segment_distribution"] = descriptive.frequency_table(df["customer_value_segment"])

    # ==================================================================
    # 1. Descriptive statistics
    # ==================================================================
    numeric_fields = [
        "customer_age", "session_duration_min", "pages_viewed", "products_viewed",
        "searches", "cart_items", "estimated_delivery_days", "delivery_delay_days",
        "engagement_score",
    ]
    payload["descriptive_numeric"] = {c: descriptive.summary(df[c].dropna()) for c in numeric_fields}
    payload["descriptive_order_value"] = descriptive.summary(df.loc[df.purchase, "order_value"])
    payload["order_value_outliers_sample"] = sorted(descriptive.outliers(df.loc[df.purchase, "order_value"]))[-30:]

    categorical_fields = [
        "gender", "income_level", "city_tier", "device", "acquisition_channel",
        "customer_segment", "payment_method", "category", "price_band", "season", "day_of_week",
    ]
    payload["descriptive_categorical"] = {c: descriptive.frequency_table(df[c]) for c in categorical_fields}

    payload["business_questions_descriptive"] = {
        "pct_orders_below_1000": descriptive.proportion_below(df.loc[df.purchase, "order_value"], 1000),
        "pct_orders_above_5000": descriptive.proportion_above(df.loc[df.purchase, "order_value"], 5000),
        "median_order_value": descriptive.median(df.loc[df.purchase, "order_value"]),
        "modal_category": descriptive.mode(df["category"]),
        "modal_device": descriptive.mode(df["device"]),
    }

    # ==================================================================
    # 2. Association
    # ==================================================================
    assoc = {}
    assoc["device_x_purchase"] = association.rate_by_group(df["device"], df["purchase"])
    assoc["income_x_purchase"] = association.rate_by_group(df["income_level"], df["purchase"])
    assoc["discount_x_purchase"] = association.rate_by_group(df["discount_exposed"], df["purchase"])
    assoc["segment_x_purchase"] = association.rate_by_group(df["customer_segment"], df["purchase"])
    assoc["channel_x_purchase"] = association.rate_by_group(df["acquisition_channel"], df["purchase"])
    assoc["campaign_x_purchase"] = association.rate_by_group(df["campaign_exposed"], df["purchase"])

    assoc["duration_x_products"] = {
        "correlation": association.correlation(df["session_duration_min"], df["products_viewed"]),
        "covariance": association.covariance(df["session_duration_min"], df["products_viewed"]),
        "fitted_line": association.fitted_line(df["session_duration_min"], df["products_viewed"]),
        "scatter": association.scatter_sample(df["session_duration_min"], df["products_viewed"]),
    }
    purch = df[df.purchase]
    assoc["products_viewed_x_order_value"] = {
        "correlation": association.correlation(purch["products_viewed"], purch["order_value"]),
        "covariance": association.covariance(purch["products_viewed"], purch["order_value"]),
        "fitted_line": association.fitted_line(purch["products_viewed"], purch["order_value"]),
        "scatter": association.scatter_sample(purch["products_viewed"], purch["order_value"]),
    }
    cust_level = df.drop_duplicates("customer_id")
    assoc["previous_orders_x_total_spend"] = {
        "correlation": association.correlation(cust_level["previous_orders"], cust_level["customer_total_spend"]),
        "covariance": association.covariance(cust_level["previous_orders"], cust_level["customer_total_spend"]),
        "fitted_line": association.fitted_line(cust_level["previous_orders"], cust_level["customer_total_spend"]),
        "scatter": association.scatter_sample(cust_level["previous_orders"], cust_level["customer_total_spend"]),
    }
    assoc["category_x_device"] = association.crosstab_relative_freq(df["category"], df["device"])
    payload["association"] = assoc

    # ==================================================================
    # 3. Misleading charts -- real underlying numbers for both versions
    # ==================================================================
    payload["misleading_charts"] = {
        "conversion_by_device_true": association.rate_by_group(df["device"], df["purchase"]),
        "revenue_by_month": (
            df[df.purchase].assign(month=df["session_date"].dt.to_period("M").astype(str))
            .groupby("month")["order_value"].sum().round(2).to_dict()
        ),
        "revenue_by_month_and_category_sample": (
            df[df.purchase].assign(month=df["session_date"].dt.to_period("M").astype(str))
            .groupby(["month", "category"])["order_value"].sum().round(2)
            .unstack(fill_value=0).to_dict(orient="index")
        ),
        "channel_total_revenue": df[df.purchase].groupby("acquisition_channel")["order_value"].sum().round(2).to_dict(),
        "channel_conversion_rate": association.rate_by_group(df["acquisition_channel"], df["purchase"]),
    }

    # ==================================================================
    # 4. Probability engine
    # ==================================================================
    P = df["purchase"]
    C = df["add_to_cart"]
    D = df["discount_exposed"]
    R = df["customer_segment"] != "New"
    M = df["device"] == "Mobile"

    payload["probability_engine"] = {
        "P_purchase": probability.p_event(P),
        "P_cart": probability.p_event(C),
        "P_discount": probability.p_event(D),
        "P_returning": probability.p_event(R),
        "P_mobile": probability.p_event(M),
        "P_purchase_and_cart": probability.p_intersection(P, C),
        "P_purchase_or_cart": probability.p_union(P, C),
        "P_purchase_complement": probability.p_complement(P),
        "P_purchase_given_cart": probability.p_conditional(P, C),
        "P_purchase_given_discount": probability.p_conditional(P, D),
        "P_purchase_given_returning": probability.p_conditional(P, R),
        "P_purchase_given_mobile": probability.p_conditional(P, M),
    }

    # ==================================================================
    # 5. Bayes
    # ==================================================================
    payload["bayes"] = bayes.bayes_purchase_given_cart(P, C)

    # ==================================================================
    # 6. Independence checks
    # ==================================================================
    payload["independence"] = {
        "discount_and_purchase": probability.independence_check(D, P),
        "device_mobile_and_purchase": probability.independence_check(M, P),
        "returning_and_purchase": probability.independence_check(R, P),
    }

    def bitpack(bool_series: pd.Series) -> str:
        arr = np.packbits(bool_series.to_numpy(dtype=bool))
        return base64.b64encode(arr.tobytes()).decode("ascii")

    payload["probability_events_bitpacked"] = {
        "n": int(len(df)),
        "events": {
            "P": bitpack(P), "C": bitpack(C), "D": bitpack(D), "R": bitpack(R), "M": bitpack(M),
        },
        "labels": {
            "P": "Purchase", "C": "Add to Cart", "D": "Discount Exposure",
            "R": "Returning Customer", "M": "Mobile User",
        },
    }

    # ==================================================================
    # 7. Combinatorics (static illustrative examples; interactive calcs
    #    run client-side using the TS mirror of analytics/combinatorics.py)
    # ==================================================================
    payload["combinatorics_examples"] = {
        "campaign_assignment": combinatorics.campaign_assignment_count(
            n_offer_types=len(df["offer_type"].unique()) - 1,  # exclude "None"
            n_segments=df["customer_segment"].nunique(),
        ),
        "choose_20_from_pool_1000": combinatorics.choose_k_customers(1000, 20),
        "bundle_3_from_12": combinatorics.product_bundle_count(12, 3),
        "factorial_5": combinatorics.factorial(5),
        "permutations_5_choose_2": combinatorics.permutations(5, 2),
        "combinations_5_choose_2": combinatorics.combinations(5, 2),
    }

    # ==================================================================
    # 8. Random variables: X = items_purchased (discrete)
    # ==================================================================
    items = df.loc[df.purchase, "items_purchased"].astype(int)
    pmf = random_variables.empirical_pmf(items)
    cdf = random_variables.empirical_cdf(items)
    payload["random_variable_items_purchased"] = {
        "pmf": pmf,
        "cdf": cdf,
        "expected_value": random_variables.expected_value_discrete(pmf),
        "variance": random_variables.variance_discrete(pmf),
        "std": random_variables.variance_discrete(pmf) ** 0.5,
    }

    # ==================================================================
    # 9. Expectation / Variance business examples
    # ==================================================================
    payload["expectation_variance"] = {
        "expected_items_per_purchase": descriptive.mean(items),
        "expected_order_value": descriptive.mean(purch["order_value"]),
        "order_value_variance": float(np.var(purch["order_value"], ddof=1)),
        "order_value_std": float(np.std(purch["order_value"], ddof=1)),
        "expected_conversions_per_1000_sessions": probability.p_event(P) * 1000,
        "segment_value_mean_var_std": {
            str(seg): {
                "mean": descriptive.mean(sub["order_value"]) if len(sub) else 0,
                "variance": float(np.var(sub["order_value"], ddof=1)) if len(sub) > 1 else 0,
                "std": float(np.std(sub["order_value"], ddof=1)) if len(sub) > 1 else 0,
                "n": int(len(sub)),
            }
            for seg, sub in purch.groupby("customer_segment", observed=True)
        },
    }

    # ==================================================================
    # 10. Bernoulli / Binomial (theoretical, parameterized by observed p)
    # ==================================================================
    observed_p = probability.p_event(P)
    payload["bernoulli"] = random_variables.bernoulli_stats(observed_p)
    payload["binomial_default"] = {
        "n": 100, "p": observed_p,
        "summary": random_variables.binomial_summary(100, observed_p),
        "curve": random_variables.binomial_pmf_curve(100, observed_p),
    }

    # ==================================================================
    # 11. Hypergeometric / Campaign sampling (theoretical, uses observed
    #     high-value-customer share as a default K/N)
    # ==================================================================
    high_value_share = (cust_level["customer_value_segment"] == "High Value").mean()
    N_default, sample_default = 500, 40
    K_default = max(1, round(N_default * high_value_share))
    payload["hypergeometric_default"] = campaign_sampling.campaign_sample_probability(
        pool_size=N_default, high_value_count=K_default, sample_size=sample_default,
        k=round(sample_default * high_value_share),
    )
    payload["observed_high_value_share"] = float(high_value_share)

    # ==================================================================
    # 12. Continuous Distribution Lab defaults
    # ==================================================================
    payload["uniform_default"] = {
        "params": {"a": 0, "b": 12},
        "summary": distributions.uniform_summary(0, 12),
        "curve": distributions.uniform_curve(0, 12),
    }
    payload["triangular_default"] = {
        "params": {"min": 2, "mode": 4, "max": 9},
        "summary": distributions.triangular_summary(2, 4, 9),
        "curve": distributions.triangular_curve(2, 4, 9),
        "p_le_5": distributions.triangular_cdf_le(5, 2, 4, 9),
        "p_gt_7": 1 - distributions.triangular_cdf_le(7, 2, 4, 9),
    }
    # exponential: rate from observed mean of next_purchase_days-like field is illustrative;
    # use segment-average days_since_last_order as the rate anchor (Regular segment)
    observed_mean_gap = df.loc[df["customer_segment"] != "New", "days_since_last_order"].mean()
    default_rate = 1 / observed_mean_gap if observed_mean_gap else 0.05
    payload["exponential_default"] = {
        "params": {"rate": round(default_rate, 4)},
        "summary": distributions.exponential_summary(default_rate),
        "curve": distributions.exponential_curve(default_rate),
        "memoryless_check": distributions.exponential_memoryless_check(default_rate, 10, 5),
        "observed_mean_days_since_last_order": float(observed_mean_gap),
    }

    # ==================================================================
    # 13. Customer segmentation + customer value dashboard
    # ==================================================================
    payload["customer_value_by_segment"] = customer_value.value_by_group(df, "customer_segment")
    payload["customer_value_by_category"] = customer_value.value_by_group(df, "category")
    payload["customer_value_by_channel"] = customer_value.value_by_group(df, "acquisition_channel")
    payload["customer_value_by_income"] = customer_value.value_by_group(df, "income_level")
    payload["customer_value_by_device"] = customer_value.value_by_group(df, "device")
    payload["customer_value_by_season"] = customer_value.value_by_group(df, "season")
    payload["order_value_distribution_by_segment"] = customer_value.order_value_distribution(df, "customer_segment")

    # ==================================================================
    # 14. Dataset meta (for Data Explorer + case study)
    # ==================================================================
    payload["dataset_meta"] = {
        "n_rows": int(len(df)),
        "n_columns": int(len(df.columns)),
        "n_customers": int(df["customer_id"].nunique()),
        "date_min": str(df["session_date"].min().date()),
        "date_max": str(df["session_date"].max().date()),
        "columns": list(df.columns),
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(jsafe(payload), f, indent=2)

    size_kb = os.path.getsize(OUT_PATH) / 1024
    print(f"Wrote {OUT_PATH} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
