from app.services.scoring import weighted_score
from app.services.ahp import compute_ahp
from app.services.energy import simulate_retrofit, aggregate_territory_retrofit


def test_weighted_score_bounds():
    res = weighted_score({"energy_performance": 80, "resilience": 70})
    assert res.global_score >= 0
    assert "energy_performance" in res.breakdown


def test_ahp_consistency():
    crit = ["a", "b", "c"]
    m = [[1, 2, 4], [0.5, 1, 2], [0.25, 0.5, 1]]
    r = compute_ahp(crit, m)
    assert abs(sum(r.weights.values()) - 1.0) < 0.01
    assert r.is_consistent  # matrice parfaitement cohérente -> CR ~ 0


def test_retrofit_and_aggregate():
    r = simulate_retrofit(100, "E", ["insulation", "glazing"])
    assert r["reduction_pct"] > 0
    assert r["co2_avoided_kg"] > 0
    agg = aggregate_territory_retrofit(
        [{"surface_m2": 100, "energy_class": "E"},
         {"surface_m2": 200, "energy_class": "C"}],
        ["insulation"],
    )
    assert agg["buildings_count"] == 2
    assert agg["total_co2_avoided_t"] >= 0
