import pytest

from analytics import combinatorics as c


def test_factorial_basic():
    assert c.factorial(5) == 120
    assert c.factorial(0) == 1


def test_factorial_negative_raises():
    with pytest.raises(ValueError):
        c.factorial(-1)


def test_permutations_basic():
    assert c.permutations(5, 2) == 20


def test_combinations_basic():
    assert c.combinations(5, 2) == 10


def test_combinations_symmetry():
    assert c.combinations(10, 3) == c.combinations(10, 7)


def test_permutations_with_repetition():
    # arranging "AAB" -> 3!/2!1! = 3
    assert c.permutations_with_repetition(3, [2, 1]) == 3


def test_permutations_with_repetition_invalid_counts():
    with pytest.raises(ValueError):
        c.permutations_with_repetition(3, [2, 2])


def test_counting_principle():
    assert c.counting_principle([3, 4, 2]) == 24


def test_choose_k_customers_matches_combinations():
    assert c.choose_k_customers(100, 5) == c.combinations(100, 5)


def test_combinations_out_of_range_raises():
    with pytest.raises(ValueError):
        c.combinations(5, 6)
