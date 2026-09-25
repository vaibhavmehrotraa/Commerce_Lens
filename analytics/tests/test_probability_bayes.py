import math

from analytics import bayes, probability as p


def test_p_event_and_complement_sum_to_one():
    event = [True, True, False, False, False]
    assert math.isclose(p.p_event(event) + p.p_complement(event), 1.0)


def test_p_union_inclusion_exclusion():
    a = [True, True, False, False]
    b = [True, False, True, False]
    union = p.p_union(a, b)
    # exactly 3 of 4 rows have a or b True
    assert math.isclose(union, 0.75)


def test_p_intersection_matches_manual_count():
    a = [True, True, False, False]
    b = [True, False, True, False]
    assert math.isclose(p.p_intersection(a, b), 0.25)


def test_p_conditional_with_zero_denominator_returns_zero():
    a = [True, False]
    b = [False, False]
    assert p.p_conditional(a, b) == 0.0


def test_p_conditional_matches_definition():
    a = [True, True, False, True]
    b = [True, True, True, False]
    manual = p.p_intersection(a, b) / p.p_event(b)
    assert math.isclose(p.p_conditional(a, b), manual)


def test_independence_check_independent_events():
    # Construct A, B independent by design: 1000 rows, A true 50%, B true 50%, uncorrelated
    import numpy as np
    rng = np.random.default_rng(0)
    a = rng.random(20000) < 0.5
    b = rng.random(20000) < 0.5
    result = p.independence_check(a, b)
    assert result["appears_independent_in_sample"] is True


def test_bayes_matches_direct_conditional():
    purchase = [True, True, False, True, False, False, True, False]
    cart = [True, False, False, True, True, False, True, False]
    result = bayes.bayes_purchase_given_cart(purchase, cart)
    assert math.isclose(
        result["p_purchase_given_cart_direct"],
        result["p_purchase_given_cart_bayes"],
        abs_tol=1e-9,
    )


def test_bayes_theorem_generic_formula():
    # Classic example: disease testing style sanity check
    p_a = 0.01
    p_b_given_a = 0.9
    p_b = 0.0089 + 0.9 * 0.01  # P(B) = P(B|A^c)P(A^c) + P(B|A)P(A)
    result = bayes.bayes_theorem(p_b_given_a, p_a, p_b)
    assert 0 <= result <= 1
