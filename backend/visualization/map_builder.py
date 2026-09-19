"""
SurakshaSetu Map Builder Module
Generates a complete, interactive Folium map containing prioritized SOS distress markers,
active hazard warning zones, evaluated safe evacuation corridors, and designated relief shelters.
"""

import json
import os
from typing import Any, Dict, List, Optional, Union

import folium
from folium.plugins import MiniMap, MarkerCluster

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    from algorithms.triage import rank_sos_requests
    from algorithms.routing import evaluate_all_corridors
except ImportError:
    from backend.algorithms.triage import rank_sos_requests
    from backend.algorithms.routing import evaluate_all_corridors

# Default path to Vellore anchor definitions
DEFAULT_GEO_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "vellore_geo.json")


def load_geo_anchors(file_path: Optional[str] = None) -> Dict[str, Any]:
    """Load Vellore center coordinates, static facilities, and predefined corridors from JSON."""
    target_path = file_path or DEFAULT_GEO_DATA_PATH
    if os.path.exists(target_path):
        with open(target_path, "r", encoding="utf-8") as f:
            return json.load(f)
    # Fallback if file not found
    return {
        "center": {"lat": 12.9165, "lon": 79.1325, "default_zoom": 13},
        "facilities": [],
        "corridors": []
    }


def _draw_facilities(m: folium.Map, facilities: List[Dict[str, Any]]) -> None:
    """Draw hospitals and emergency shelters with distinct icons and popups."""
    facility_group = folium.FeatureGroup(name="Safe Facilities & Shelters", show=True)

    for fac in facilities:
        f_type = fac.get("type", "shelter").lower()
        color = "darkgreen" if "hosp" in f_type else "purple"
        icon_name = "plus-sign" if "hosp" in f_type else "home"
        type_title = "Hospital" if "hosp" in f_type else "Evacuation Shelter"

        html_content = f"""
        <div style="font-family: Arial, sans-serif; min-width: 200px;">
            <h4 style="margin: 0 0 5px 0; color: {'#1b5e20' if 'hosp' in f_type else '#4a148c'};">
                {fac.get('name', 'Facility')}
            </h4>
            <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; background: #e0e0e0; padding: 2px 6px; border-radius: 3px;">
                {type_title}
            </span>
            <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;"/>
            <p style="margin: 3px 0; font-size: 12px;"><b>Capacity:</b> {fac.get('capacity', 'N/A')} persons</p>
            <p style="margin: 3px 0; font-size: 12px;"><b>Contact:</b> {fac.get('contact', 'N/A')}</p>
            <p style="margin: 3px 0; font-size: 11px; color: #555;">{fac.get('address', '')}</p>
        </div>
        """

        folium.Marker(
            location=[float(fac["lat"]), float(fac["lon"])],
            popup=folium.Popup(html_content, max_width=280),
            tooltip=f"{type_title}: {fac.get('name')}",
            icon=folium.Icon(color=color, icon=icon_name, prefix="glyphicon")
        ).add_to(facility_group)

    facility_group.add_to(m)


def _draw_hazards(m: folium.Map, hazards_data: Union[List[Dict[str, Any]], Any]) -> None:
    """Draw active hazards with circular danger perimeter zones."""
    hazard_group = folium.FeatureGroup(name="Hazards & Danger Zones", show=True)

    if HAS_PANDAS and isinstance(hazards_data, pd.DataFrame):
        records = hazards_data.to_dict(orient="records")
    elif isinstance(hazards_data, list):
        records = hazards_data
    else:
        records = []

    for h in records:
        # Check active status
        is_active = h.get("is_active", True)
        if str(is_active).lower() in ["false", "0", "no"]:
            continue

        try:
            h_lat = float(h["latitude"])
            h_lon = float(h["longitude"])
        except (KeyError, ValueError, TypeError):
            continue

        radius = float(h.get("severity_radius_meters", 150) or 150)
        h_type = h.get("hazard_type", "Active Threat")

        # Threat zone circle
        folium.Circle(
            location=[h_lat, h_lon],
            radius=radius,
            color="#d32f2f",
            fill=True,
            fill_color="#ef5350",
            fill_opacity=0.35,
            weight=2,
            tooltip=f"Danger Zone: {h_type} ({int(radius)}m buffer)"
        ).add_to(hazard_group)

        # Danger marker icon
        popup_html = f"""
        <div style="font-family: Arial, sans-serif; min-width: 180px;">
            <h4 style="margin: 0 0 5px 0; color: #b71c1c;">⚠️ {h_type}</h4>
            <p style="margin: 3px 0; font-size: 12px;"><b>Danger Radius:</b> {int(radius)} meters</p>
            <p style="margin: 3px 0; font-size: 11px; color: #666;">Avoid entering or crossing this perimeter.</p>
        </div>
        """

        folium.Marker(
            location=[h_lat, h_lon],
            popup=folium.Popup(popup_html, max_width=250),
            tooltip=f"Hazard: {h_type}",
            icon=folium.Icon(color="red", icon="warning-sign", prefix="glyphicon")
        ).add_to(hazard_group)

    hazard_group.add_to(m)


def _draw_routes(m: folium.Map, evaluated_corridors: List[Dict[str, Any]]) -> None:
    """Draw evaluated safe, detour, and blocked evacuation corridors."""
    route_group = folium.FeatureGroup(name="Evacuation Corridors", show=True)

    for corr in evaluated_corridors:
        status = corr.get("status", "PRIMARY_ACTIVE")
        name = corr.get("name", "Corridor")
        primary_pts = corr.get("primary_route", [])
        alt_pts = corr.get("alternate_route", [])

        if status == "PRIMARY_ACTIVE":
            # Primary path is safe (Green)
            folium.PolyLine(
                locations=primary_pts,
                color="#2e7d32",
                weight=6,
                opacity=0.85,
                tooltip=f"SAFE ROUTE: {name}",
                popup=folium.Popup(f"<b>{name}</b><br><span style='color:green;'>Active Safe Path</span>", max_width=250)
            ).add_to(route_group)

        elif status == "DETOUR_ACTIVE":
            # Primary path is blocked (Red dashed)
            folium.PolyLine(
                locations=primary_pts,
                color="#d32f2f",
                weight=4,
                opacity=0.6,
                dash_array="8, 8",
                tooltip=f"BLOCKED: {name} (Primary)",
                popup=folium.Popup(f"<b>{name}</b><br><span style='color:red;'>Primary Blocked by Hazard</span>", max_width=250)
            ).add_to(route_group)

            # Alternate path is active detour (Royal Blue)
            folium.PolyLine(
                locations=alt_pts,
                color="#1565c0",
                weight=6,
                opacity=0.9,
                tooltip=f"RECOMMENDED DETOUR: {name}",
                popup=folium.Popup(f"<b>{name}</b><br><span style='color:#1565c0;'>Active Detour Route</span>", max_width=250)
            ).add_to(route_group)

        else:  # ALL_BLOCKED
            folium.PolyLine(
                locations=primary_pts,
                color="#b71c1c",
                weight=5,
                opacity=0.8,
                dash_array="5, 10",
                tooltip=f"CRITICAL: {name} Completely Blocked",
                popup=folium.Popup(f"<b>{name}</b><br><span style='color:red;'>CRITICAL: All Paths Blocked</span>", max_width=250)
            ).add_to(route_group)

    route_group.add_to(m)


def _draw_sos_requests(m: folium.Map, sos_data: Union[List[Dict[str, Any]], Any]) -> None:
    """Draw prioritized SOS requests with triage badges and rich popup cards."""
    sos_group = folium.FeatureGroup(name="SOS Distress Calls", show=True)

    ranked_sos = rank_sos_requests(sos_data)
    if HAS_PANDAS and isinstance(ranked_sos, pd.DataFrame):
        records = ranked_sos.to_dict(orient="records")
    else:
        records = ranked_sos

    for r in records:
        try:
            lat = float(r["latitude"])
            lon = float(r["longitude"])
        except (KeyError, ValueError, TypeError):
            continue

        score = r.get("triage_score", 0.0)
        tier = r.get("priority_tier", "P3 - Standard")
        color = r.get("marker_color", "blue")
        icon = r.get("marker_icon", "info-circle")

        header_bg = "#d32f2f" if "P1" in tier else ("#f57c00" if "P2" in tier else "#1976d2")
        caller_name = r.get("sender_name") or r.get("caller_name", "Disaster Victim")

        popup_html = f"""
        <div style="font-family: Arial, sans-serif; width: 240px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
            <div style="background: {header_bg}; color: white; padding: 8px 10px;">
                <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Triage Priority</span>
                <div style="font-size: 15px; font-weight: bold;">{tier} (Score: {score})</div>
            </div>
            <div style="padding: 10px; background: #ffffff; font-size: 12px;">
                <div style="margin-bottom: 5px;"><b>Citizen:</b> {caller_name}</div>
                <div style="margin-bottom: 5px;"><b>Headcount:</b> {r.get('people_count', 1)} people ({r.get('vulnerable_count', 0)} vulnerable)</div>
                <div style="margin-bottom: 5px;"><b>Medical Need:</b> {r.get('medical_urgency', 'None')}</div>
                <div style="margin-bottom: 5px;"><b>Flood Level:</b> {r.get('water_depth', 'Ground')}</div>
                <div style="margin-bottom: 5px;"><b>Status:</b> {r.get('status', 'Pending')}</div>
                <div style="margin-top: 8px; font-size: 11px; color: #666; border-top: 1px dashed #ccc; padding-top: 5px;">
                    Request ID: #{r.get('id', 'N/A')}
                </div>
            </div>
        </div>
        """

        folium.Marker(
            location=[lat, lon],
            popup=folium.Popup(popup_html, max_width=270),
            tooltip=f"{tier}: {caller_name} (Score: {score})",
            icon=folium.Icon(color=color, icon=icon, prefix="fa")
        ).add_to(sos_group)

    sos_group.add_to(m)


def build_emergency_map(
    sos_data: Union[List[Dict[str, Any]], Any],
    hazards_data: Union[List[Dict[str, Any]], Any],
    geo_data_path: Optional[str] = None
) -> folium.Map:
    """
    MASTER EXPORT FUNCTION for Member 1 (Streamlit Frontend Lead).

    Accepts SOS requests and hazards (as Pandas DataFrames or lists of dicts),
    applies triage ranking and hazard route clearance, and returns a fully
    configured folium.Map object ready for rendering with st_folium().
    """
    geo_config = load_geo_anchors(geo_data_path)
    center = geo_config.get("center", {"lat": 12.9165, "lon": 79.1325, "default_zoom": 13})

    # 1. Initialize Base Map
    m = folium.Map(
        location=[center["lat"], center["lon"]],
        zoom_start=center.get("default_zoom", 13),
        tiles="OpenStreetMap",
        control_scale=True
    )

    # 2. Evaluate Corridors
    corridors = geo_config.get("corridors", [])
    evaluated_corridors = evaluate_all_corridors(corridors, hazards_data)

    # 3. Add Layers
    _draw_facilities(m, geo_config.get("facilities", []))
    _draw_hazards(m, hazards_data)
    _draw_routes(m, evaluated_corridors)
    _draw_sos_requests(m, sos_data)

    # 4. Add Utility Controls
    MiniMap(toggle_display=True, position="bottomright").add_to(m)
    folium.LayerControl(position="topright", collapsed=False).add_to(m)

    # 5. Add Legend
    legend_html = '''
    <div style="position: fixed; bottom: 50px; left: 50px; width: 160px; height: 120px; 
        background-color: white; border:2px solid grey; z-index:9999; font-size:12px;
        padding: 10px; border-radius: 5px;">
        <b>Map Legend</b><br>
        <i style="background: green; color: green; width: 10px; height: 10px; display: inline-block;"></i> Safe Route<br>
        <i style="background: blue; color: blue; width: 10px; height: 10px; display: inline-block;"></i> Detour Route<br>
        <i style="background: red; color: red; width: 10px; height: 10px; display: inline-block;"></i> Blocked Route<br>
        <i style="border-radius: 50%; background: red; width: 10px; height: 10px; display: inline-block;"></i> Hazard Zone
    </div>
    '''
    m.get_root().html.add_child(folium.Element(legend_html))

    return m
