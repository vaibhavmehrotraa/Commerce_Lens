"""
Bayes' theorem applied to an e-commerce example:
"Given a session has an add-to-cart event, what is the probability it
results in a purchase?"

We compute P(Purchase | Cart) two independent ways and show they agree:
  1. Directly, empirically: P(Purchase AND Cart) / P(Cart)
  2. Via Bayes' theorem: P(Cart | Purchase) * P(Purchase) / P(Cart)
"""

from __future__ import annotations

from typing import Sequence

from . import probability as prob


def bayes_purchase_given_cart(purchase: Sequence[bool], cart: Sequence[bool]) -> dict:
    p_purchase = prob.p_event(purchase)
    p_cart = prob.p_event(cart)
    p_cart_given_purchase = prob.p_conditional(cart, purchase)
    p_purchase_given_cart_direct = prob.p_conditional(purchase, cart)

    bayes_numerator = p_cart_given_purchase * p_purchase
    p_purchase_given_cart_bayes = bayes_numerator / p_cart if p_cart > 0 else 0.0

    return {
        "p_purchase": p_purchase,
        "p_cart": p_cart,
        "p_cart_given_purchase": p_cart_given_purchase,
        "p_purchase_given_cart_direct": p_purchase_given_cart_direct,
        "p_purchase_given_cart_bayes": p_purchase_given_cart_bayes,
        "absolute_difference": abs(p_purchase_given_cart_direct - p_purchase_given_cart_bayes),
    }


def bayes_theorem(p_b_given_a: float, p_a: float, p_b: float) -> float:
    """Generic Bayes' theorem: P(A|B) = P(B|A) * P(A) / P(B)."""
    if p_b == 0:
        return 0.0
    return (p_b_given_a * p_a) / p_b
