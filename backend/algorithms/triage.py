"""
SurakshaSetu Triage Scoring Module
Calculates deterministic rescue prioritization scores (0 - 100) based on
medical urgency, vulnerable demographics, water depth, and group size.
"""

from typing import Any, Dict, List, Tuple, Union

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


def calculate_triage_score(record: Union[Dict[str, Any], Any]) -> float:
    """
    CANONICAL SCORING REFERENCE: Frontend triage.ts must mirror these weights.
    Calculate a normalized triage priority score from 0.0 to 100.0.
    Accepts either a dictionary or a Pandas Series / DataFrame row.

    Scoring Breakdown:
    - Medical Urgency: up to 40 points
    - Vulnerable Count (Infants, Elderly, Pregnant): up to 30 points
    - Flood / Environmental Threat: up to 20 points
    - Total Group Size: up to 10 points
    """
    # Helper to retrieve fields safely regardless of dict or Series
    def get_field(field_name: str, default: Any = None) -> Any:
        if isinstance(record, dict):
            return record.get(field_name, default)
        elif HAS_PANDAS and hasattr(record, "get"):
            return record.get(field_name, default)
        elif hasattr(record, field_name):
            return getattr(record, field_name)
        return default

    # 1. Medical Urgency (Max: 40 pts)
    medical = str(get_field("medical_urgency", "none")).strip().lower()
    medical_pts = 0.0
    if any(k in medical for k in ["critical", "cardiac", "stroke", "severe", "trauma", "pregnant_labor"]):
        medical_pts = 40.0
    elif any(k in medical for k in ["moderate", "medium", "fracture", "injury", "diabetes", "pregnant"]):
        medical_pts = 25.0
    elif any(k in medical for k in ["low", "minor"]):
        medical_pts = 10.0

    # 2. Vulnerable Demographics (Max: 30 pts)
    # 10 pts per infant / senior / pregnant individual
    try:
        vulnerable_count = int(get_field("vulnerable_count", 0) or 0)
    except (ValueError, TypeError):
        vulnerable_count = 0
    vuln_pts = min(max(vulnerable_count, 0) * 10.0, 30.0)

    # 3. Environmental Threat & Water Depth (Max: 20 pts)
    water = str(get_field("water_depth", "none")).strip().lower()
    water_pts = 0.0
    if any(k in water for k in ["roof", "submerged", "rapid_current", "ceiling", "above 6ft"]):
        water_pts = 20.0
    elif any(k in water for k in ["first floor", "chest", "waist", "3ft to 6ft"]):
        water_pts = 13.0
    elif any(k in water for k in ["ground floor", "knee", "ankle", "1ft to 3ft"]):
        water_pts = 6.0

    # 4. Group Headcount (Max: 10 pts)
    # 2 pts per person, capped at 10 pts
    try:
        people_count = int(get_field("people_count", 1) or 1)
    except (ValueError, TypeError):
        people_count = 1
    group_pts = min(max(people_count, 0) * 2.0, 10.0)

    total_score = medical_pts + vuln_pts + water_pts + group_pts
    return round(min(max(total_score, 0.0), 100.0), 1)


def assign_priority_tier(score: float) -> Tuple[str, str, str]:
    """
    Returns (Tier Name, Marker Color, Icon Name) based on the triage score.
    - P1 Critical (>= 75): Red, ambulance
    - P2 Urgent (45 - 74): Orange, exclamation-circle
    - P3 Standard (< 45): Blue, info-circle
    """
    if score >= 75.0:
        return "P1 - Critical", "red", "ambulance"
    elif score >= 45.0:
        return "P2 - Urgent", "orange", "exclamation-triangle"
    else:
        return "P3 - Standard", "blue", "info-circle"


def rank_sos_requests(sos_records: Union[List[Dict[str, Any]], Any]) -> Any:
    """
    Computes triage score, priority tier, marker color, and icon for each record,
    then returns the records sorted in descending order of priority.
    Supports list of dicts and Pandas DataFrames.
    """
    if HAS_PANDAS and isinstance(sos_records, pd.DataFrame):
        df = sos_records.copy()
        if df.empty:
            df["triage_score"] = []
            df["priority_tier"] = []
            df["marker_color"] = []
            df["marker_icon"] = []
            return df

        scores = [calculate_triage_score(row) for _, row in df.iterrows()]
        tiers = [assign_priority_tier(s) for s in scores]

        df["triage_score"] = scores
        df["priority_tier"] = [t[0] for t in tiers]
        df["marker_color"] = [t[1] for t in tiers]
        df["marker_icon"] = [t[2] for t in tiers]
        return df.sort_values(by="triage_score", ascending=False).reset_index(drop=True)

    # Process list of dicts
    enriched = []
    for item in sos_records:
        rec = dict(item)
        score = calculate_triage_score(rec)
        tier, color, icon = assign_priority_tier(score)
        rec["triage_score"] = score
        rec["priority_tier"] = tier
        rec["marker_color"] = color
        rec["marker_icon"] = icon
        enriched.append(rec)

    enriched.sort(key=lambda x: x["triage_score"], reverse=True)
    return enriched
