"""
SurakshaSetu Backend 2 Verification Script
Tests Triage Scoring, Route Proximity & Obstruction, and builds an HTML map.
"""

import os
import sys

# Ensure local directory is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from algorithms.triage import calculate_triage_score, assign_priority_tier, rank_sos_requests
from algorithms.routing import haversine_distance, point_to_segment_distance, evaluate_all_corridors
from visualization.map_builder import build_emergency_map, load_geo_anchors
from mock_data import get_mock_sos_data, get_mock_hazards_data


def test_triage_engine():
    print("\n--- [1/3] Testing Triage Engine ---")
    
    # Test high urgency case
    crit_record = {
        "medical_urgency": "Cardiac patient",
        "vulnerable_count": 2,
        "water_depth": "Roof Top",
        "people_count": 4
    }
    score = calculate_triage_score(crit_record)
    tier, color, icon = assign_priority_tier(score)
    print(f"Critical Case -> Score: {score}/100 | Tier: {tier} | Color: {color}")
    assert score >= 75.0, f"Expected P1 score, got {score}"
    assert tier == "P1 - Critical", f"Expected P1 tier, got {tier}"

    # Test low urgency case
    low_record = {
        "medical_urgency": "None",
        "vulnerable_count": 0,
        "water_depth": "Ground Floor",
        "people_count": 1
    }
    low_score = calculate_triage_score(low_record)
    low_tier, _, _ = assign_priority_tier(low_score)
    print(f"Low Case -> Score: {low_score}/100 | Tier: {low_tier}")
    assert low_score < 45.0, f"Expected P3 score, got {low_score}"

    # Test ranking
    sos_df = get_mock_sos_data()
    ranked = rank_sos_requests(sos_df)
    print(f"Ranked {len(ranked)} SOS calls successfully.")
    if hasattr(ranked, "iloc"):
        first_score = ranked.iloc[0]["triage_score"]
        last_score = ranked.iloc[-1]["triage_score"]
    else:
        first_score = ranked[0]["triage_score"]
        last_score = ranked[-1]["triage_score"]
    assert first_score >= last_score, "SOS requests must be ranked descending by priority"
    print("[PASS] Triage Engine passed all tests!")


def test_routing_engine():
    print("\n--- [2/3] Testing Routing & Hazard Intersect Engine ---")
    
    # Check Haversine distance between two points ~ 1km apart in Vellore
    dist = haversine_distance(12.9165, 79.1325, 12.9255, 79.1325)
    print(f"Haversine test distance: {dist:.1f} meters")
    assert 900 <= dist <= 1100, f"Distance calculation abnormal: {dist}"

    # Check Corridor evaluation with intentional mock obstruction
    geo_data = load_geo_anchors()
    hazards_df = get_mock_hazards_data()
    evaluated = evaluate_all_corridors(geo_data["corridors"], hazards_df)

    print(f"Evaluated {len(evaluated)} Corridors:")
    for corr in evaluated:
        print(f" - {corr['name']}: {corr['status']} ({corr['status_label']})")

    # Verify that Corridor 1 correctly triggered the detour
    corr1 = next(c for c in evaluated if c["id"] == "CORR_KATPADI_CMC")
    assert corr1["status"] == "DETOUR_ACTIVE", f"Expected Corridor 1 to activate DETOUR, got {corr1['status']}"
    assert corr1["primary_blocked"] is True, "Expected primary route to be flagged blocked"
    print("[PASS] Routing & Obstruction Engine passed all tests!")


def test_map_assembly():
    print("\n--- [3/3] Testing Folium Map Assembly & Output ---")
    sos_df = get_mock_sos_data()
    hazards_df = get_mock_hazards_data()

    emergency_map = build_emergency_map(sos_df, hazards_df)
    output_html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vellore_emergency_map.html")
    emergency_map.save(output_html_path)

    assert os.path.exists(output_html_path), "HTML map file was not generated"
    file_size_kb = os.path.getsize(output_html_path) / 1024
    print(f"[PASS] Map successfully generated: {output_html_path} ({file_size_kb:.1f} KB)")


if __name__ == "__main__":
    try:
        test_triage_engine()
        test_routing_engine()
        test_map_assembly()
        print("\n==========================================")
        print("ALL BACKEND 2 MODULES VERIFIED 100% OK!")
        print("==========================================")
    except Exception as e:
        print(f"\n[ERROR] Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
