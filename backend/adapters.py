"""
SurakshaSetu - Data Adapter Layer (adapters.py)
Bridges column name differences between database.py output and Backend 2 algorithm input.

This module ensures Member 2's database DataFrames can be directly consumed by
Backend 2's triage scoring, routing engine, and Folium map builder.

Usage:
    from backend.adapters import adapt_sos_for_triage, adapt_hazards_for_routing
    from database import get_all_sos_as_dataframe, get_all_hazards_as_dataframe

    sos_df = adapt_sos_for_triage(get_all_sos_as_dataframe())
    hazards_df = adapt_hazards_for_routing(get_all_hazards_as_dataframe())
"""

import pandas as pd


def adapt_sos_for_triage(df_sos: pd.DataFrame) -> pd.DataFrame:
    """
    Adapts database.py SOS DataFrame to match Backend 2 triage.py expected schema.

    Mappings:
        medical_need (int 0/1) -> medical_urgency (str: "critical"/"none")
        vulnerable_infants + elderly + pregnant -> vulnerable_count (int: total)
        water_depth already present (added to DB schema)
    """
    if df_sos.empty:
        return df_sos

    df = df_sos.copy()

    def map_urgency(row):
        if row.get("medical_need") in [1, True, "1"]:
            return "critical"
        elif int(row.get("vulnerable_pregnant", 0) or 0) > 0:
            return "pregnant"
        return "none"

    df["medical_urgency"] = df.apply(map_urgency, axis=1)

    # Combine 3 vulnerability columns into single count
    df["vulnerable_count"] = (
        df.get("vulnerable_infants", 0).fillna(0).astype(int) +
        df.get("vulnerable_elderly", 0).fillna(0).astype(int) +
        df.get("vulnerable_pregnant", 0).fillna(0).astype(int)
    )

    # Ensure water_depth exists (fallback for old DB without the column)
    if "water_depth" not in df.columns:
        df["water_depth"] = "unknown"

    return df


def adapt_hazards_for_routing(df_hazards: pd.DataFrame) -> pd.DataFrame:
    """
    Adapts database.py Hazard DataFrame to match Backend 2 routing.py expected schema.

    Mappings:
        severity (str) -> severity_radius_meters (float) if missing
        status (str) -> is_active (bool) if missing
    """
    if df_hazards.empty:
        return df_hazards

    df = df_hazards.copy()

    # Ensure severity_radius_meters exists
    if "severity_radius_meters" not in df.columns:
        severity_map = {"Critical": 300.0, "High": 200.0, "Medium": 150.0, "Low": 50.0}
        df["severity_radius_meters"] = df["severity"].map(severity_map).fillna(150.0)

    # Ensure is_active exists (boolean from status string)
    if "is_active" not in df.columns:
        df["is_active"] = df["status"].isin(["Active", "Verified"])
    else:
        # Convert integer 0/1 from DB to boolean
        df["is_active"] = df["is_active"].astype(bool)

    return df


def adapt_sos_as_dicts(df_sos: pd.DataFrame) -> list:
    """
    Converts adapted SOS DataFrame to list of dicts for Backend 2's rank_sos_requests().
    """
    adapted = adapt_sos_for_triage(df_sos)
    return adapted.to_dict(orient="records")


def adapt_hazards_as_dicts(df_hazards: pd.DataFrame) -> list:
    """
    Converts adapted Hazard DataFrame to list of dicts for Backend 2's evaluate_all_corridors().
    """
    adapted = adapt_hazards_for_routing(df_hazards)
    return adapted.to_dict(orient="records")
