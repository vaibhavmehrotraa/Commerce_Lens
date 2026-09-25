"""
CommerceLens dataset validator.

Runs a battery of integrity checks against data/commerce_sessions.csv and
prints a pass/fail report. Also writes data/validation_report.json so the
website can display live validation status rather than a claimed one.

Usage:
    python data/validate_dataset.py
"""

from __future__ import annotations

import json
import os
import sys

import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(HERE, "commerce_sessions.csv")
REPORT_PATH = os.path.join(HERE, "validation_report.json")

VALID_VALUES = {
    "gender": {"Female", "Male", "Other"},
    "income_level": {"Low", "Lower-Middle", "Upper-Middle", "High"},
    "city_tier": {"Tier 1", "Tier 2", "Tier 3"},
    "device": {"Mobile", "Desktop", "Tablet"},
    "customer_segment": {"New", "Occasional", "Regular", "Loyal"},
    "customer_value_segment": {"High Value", "Mid Value", "Low Value", "No Purchase Yet"},
}


def check(results: list, name: str, passed: bool, detail: str = "") -> None:
    results.append({"check": name, "passed": bool(passed), "detail": detail})


def main() -> int:
    if not os.path.exists(CSV_PATH):
        print(f"ERROR: {CSV_PATH} not found. Run data/generate_dataset.py first.")
        return 1

    df = pd.read_csv(CSV_PATH, parse_dates=["session_date"])
    results: list = []

    # Row / schema
    check(results, "row_count_minimum_60000", len(df) >= 60_000, f"rows={len(df):,}")

    # Identifiers
    check(results, "no_duplicate_session_ids", not df["session_id"].duplicated().any(),
          f"duplicates={df['session_id'].duplicated().sum()}")
    check(results, "valid_customer_ids", df["customer_id"].str.match(r"^CUST\d+$").all())

    # Demographics
    check(results, "sensible_ages", df["customer_age"].between(16, 90).all(),
          f"range=[{df['customer_age'].min()}, {df['customer_age'].max()}]")

    # Categoricals
    for col, allowed in VALID_VALUES.items():
        bad = set(df[col].unique()) - allowed
        check(results, f"valid_categorical_values::{col}", len(bad) == 0, f"unexpected={bad}")

    # Non-negativity
    check(results, "no_negative_order_value", (df["order_value"] >= 0).all())
    check(results, "no_negative_duration", (df["session_duration_min"] >= 0).all())
    check(results, "no_negative_delivery_time", (df["estimated_delivery_days"] >= 0).all())
    check(results, "no_negative_delivery_delay", (df["delivery_delay_days"] >= 0).all())
    check(results, "no_negative_items_purchased", (df["items_purchased"] >= 0).all())
    check(results, "no_negative_cart_items", (df["cart_items"] >= 0).all())

    # Purchase-outcome coherence
    check(results, "purchase0_implies_order_value_0",
          (df.loc[~df["purchase"], "order_value"] == 0).all())
    check(results, "purchase1_implies_order_value_positive",
          (df.loc[df["purchase"], "order_value"] > 0).all())
    check(results, "purchase0_implies_items_purchased_0",
          (df.loc[~df["purchase"], "items_purchased"] == 0).all())
    check(results, "purchase1_implies_items_purchased_positive",
          (df.loc[df["purchase"], "items_purchased"] > 0).all())

    # Returns only for purchased orders
    check(results, "returns_only_for_purchased_orders",
          (df.loc[df["returned"], "purchase"] == True).all())  # noqa: E712
    check(results, "return_days_zero_when_not_returned",
          (df.loc[~df["returned"], "return_days"] == 0).all())
    check(results, "return_days_positive_when_returned",
          (df.loc[df["returned"], "return_days"] > 0).all())

    # cart_items <-> add_to_cart consistency
    check(results, "cart_items_zero_when_no_add_to_cart",
          (df.loc[~df["add_to_cart"], "cart_items"] == 0).all())
    check(results, "cart_items_positive_when_add_to_cart",
          (df.loc[df["add_to_cart"], "cart_items"] > 0).all())

    # previous_orders <-> customer_segment consistency
    seg_from_orders = pd.cut(
        df["previous_orders"], bins=[-1, 0, 2, 7, np.inf],
        labels=["New", "Occasional", "Regular", "Loyal"],
    ).astype(str)
    mismatch = (seg_from_orders != df["customer_segment"]).sum()
    check(results, "previous_orders_consistent_with_segment", mismatch == 0,
          f"mismatched_rows={mismatch}")

    # Date range
    check(results, "valid_date_range",
          (df["session_date"] >= "2024-01-01").all() and (df["session_date"] <= "2025-12-31").all())

    # Probability-scale fields
    check(results, "discount_pct_in_0_100", df["discount_pct"].between(0, 100).all())
    check(results, "customer_return_rate_in_0_1", df["customer_return_rate"].between(0, 1).all())
    check(results, "hour_in_0_23", df["hour"].between(0, 23).all())
    check(results, "rating_history_in_1_5", df["customer_rating_history"].between(1, 5).all())

    # satisfaction/margin only present for purchased sessions
    check(results, "satisfaction_null_iff_not_purchased",
          df.loc[~df["purchase"], "customer_satisfaction"].isna().all())
    check(results, "margin_null_iff_not_purchased",
          df.loc[~df["purchase"], "profit_margin_pct"].isna().all())

    n_pass = sum(r["passed"] for r in results)
    n_total = len(results)
    all_passed = n_pass == n_total

    report = {
        "generated_from": CSV_PATH,
        "row_count": len(df),
        "column_count": len(df.columns),
        "checks_passed": n_pass,
        "checks_total": n_total,
        "all_passed": all_passed,
        "results": results,
    }
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)

    print(f"CommerceLens dataset validation: {n_pass}/{n_total} checks passed")
    for r in results:
        status = "PASS" if r["passed"] else "FAIL"
        print(f"  [{status}] {r['check']}" + (f" -- {r['detail']}" if r["detail"] else ""))
    print(f"\nReport written to {REPORT_PATH}")

    return 0 if all_passed else 2


if __name__ == "__main__":
    sys.exit(main())
