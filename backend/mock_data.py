"""
SurakshaSetu Mock Data Generator
Provides realistic sample SOS requests and hazard reports in Vellore
matching the schema agreed upon with Member 2 (Database Architect).
"""

from typing import Any, Dict, List

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False


def get_mock_sos_data(as_dataframe: bool = True) -> Any:
    """Returns sample SOS distress calls in Vellore."""
    data: List[Dict[str, Any]] = [
        {
            "id": 101,
            "caller_name": "Ramanathan K.",
            "latitude": 12.9430,
            "longitude": 79.1690,
            "medical_urgency": "Cardiac patient, out of medication",
            "people_count": 4,
            "vulnerable_count": 2,  # 1 elderly, 1 infant
            "water_depth": "Roof Top",
            "status": "Pending",
            "timestamp": "2026-09-18 16:30:00"
        },
        {
            "id": 102,
            "caller_name": "Priya Sundaram",
            "latitude": 12.9550,
            "longitude": 79.1480,
            "medical_urgency": "Fracture / Leg injury",
            "people_count": 3,
            "vulnerable_count": 1,
            "water_depth": "First Floor",
            "status": "In-Progress",
            "timestamp": "2026-09-18 16:45:00"
        },
        {
            "id": 103,
            "caller_name": "Anand Kumar",
            "latitude": 12.8900,
            "longitude": 79.1300,
            "medical_urgency": "None",
            "people_count": 2,
            "vulnerable_count": 0,
            "water_depth": "Ground Floor",
            "status": "Pending",
            "timestamp": "2026-09-18 17:00:00"
        },
        {
            "id": 104,
            "caller_name": "Deepa Venkatesh",
            "latitude": 12.9280,
            "longitude": 79.1380,
            "medical_urgency": "Pregnant woman in labor",
            "people_count": 3,
            "vulnerable_count": 1,
            "water_depth": "First Floor",
            "status": "Pending",
            "timestamp": "2026-09-18 17:10:00"
        },
        {
            "id": 105,
            "caller_name": "Suresh Babu",
            "latitude": 12.9100,
            "longitude": 79.1450,
            "medical_urgency": "Minor cuts and bruises",
            "people_count": 5,
            "vulnerable_count": 0,
            "water_depth": "Waist deep",
            "status": "Pending",
            "timestamp": "2026-09-18 17:20:00"
        },
        {
            "id": 106,
            "caller_name": "Lakshmi Narayanan",
            "latitude": 12.9650,
            "longitude": 79.1550,
            "medical_urgency": "Critical - Stroke symptoms",
            "people_count": 2,
            "vulnerable_count": 1,
            "water_depth": "Submerged",
            "status": "Pending",
            "timestamp": "2026-09-18 17:35:00"
        }
    ]
    if as_dataframe and HAS_PANDAS:
        return pd.DataFrame(data)
    return data


def get_mock_hazards_data(as_dataframe: bool = True) -> Any:
    """
    Returns sample hazards in Vellore.
    Hazard 201 is deliberately placed at (12.9580, 79.1500) to intersect
    Corridor 1's Primary Route (Katpadi -> CMC) and trigger the alternate detour!
    """
    data: List[Dict[str, Any]] = [
        {
            "id": 201,
            "hazard_type": "Severe Flash Flood / Submerged Bridge",
            "latitude": 12.9580,
            "longitude": 79.1500,
            "severity_radius_meters": 200,
            "is_active": True,
            "reported_time": "2026-09-18 16:15:00"
        },
        {
            "id": 202,
            "hazard_type": "Downed High-Voltage Powerline",
            "latitude": 12.9370,
            "longitude": 79.1620,
            "severity_radius_meters": 120,
            "is_active": True,
            "reported_time": "2026-09-18 16:50:00"
        }
    ]
    if as_dataframe and HAS_PANDAS:
        return pd.DataFrame(data)
    return data
