"""
SurakshaSetu Spatial Routing & Hazard Proximity Engine
Computes Haversine distances, perpendicular point-to-polyline clearance,
and evaluates safe vs. compromised evacuation corridors.
"""

import math
from typing import Any, Dict, List, Tuple, Union

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

EARTH_RADIUS_METERS = 6371000.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth surface in meters.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_METERS * c


def _to_meters_cartesian(lat: float, lon: float, ref_lat: float, ref_lon: float) -> Tuple[float, float]:
    """
    Equirectangular projection to local Cartesian meters around a reference anchor.
    Highly accurate for local city scales (< 50 km).
    """
    phi_avg = math.radians(ref_lat)
    x = math.radians(lon - ref_lon) * math.cos(phi_avg) * EARTH_RADIUS_METERS
    y = math.radians(lat - ref_lat) * EARTH_RADIUS_METERS
    return x, y


def point_to_segment_distance(
    pt: Tuple[float, float],
    seg_start: Tuple[float, float],
    seg_end: Tuple[float, float],
    margin: float = 0.0
) -> float:
    """
    Calculate the shortest distance in meters from a point (lat, lon) to a line segment
    defined by seg_start (lat, lon) and seg_end (lat, lon).
    """
    p_lat, p_lon = pt
    s_lat, s_lon = seg_start
    e_lat, e_lon = seg_end

    # Reference point for local projection
    ref_lat = s_lat
    ref_lon = s_lon

    px, py = _to_meters_cartesian(p_lat, p_lon, ref_lat, ref_lon)
    sx, sy = 0.0, 0.0
    ex, ey = _to_meters_cartesian(e_lat, e_lon, ref_lat, ref_lon)

    # Bounding box early-exit check
    if margin > 0.0:
        if (px < min(sx, ex) - margin or px > max(sx, ex) + margin or
            py < min(sy, ey) - margin or py > max(sy, ey) + margin):
            return float('inf')

    # Segment vector
    dx = ex - sx
    dy = ey - sy
    seg_len_sq = dx * dx + dy * dy

    if seg_len_sq < 1e-6:
        # Segment start and end are practically identical
        return math.hypot(px - sx, py - sy)

    # Projection parameter t of point P onto segment S->E
    t = ((px - sx) * dx + (py - sy) * dy) / seg_len_sq

    # Clamp t to segment bounds [0.0, 1.0]
    t_clamped = max(0.0, min(1.0, t))

    # Nearest point on segment in local meters
    proj_x = sx + t_clamped * dx
    proj_y = sy + t_clamped * dy

    return math.hypot(px - proj_x, py - proj_y)


def _extract_hazard_list(hazards_data: Union[List[Dict[str, Any]], Any]) -> List[Dict[str, Any]]:
    """Normalize input hazards (DataFrame or list of dicts) into a list of dicts."""
    if HAS_PANDAS and isinstance(hazards_data, pd.DataFrame):
        if hazards_data.empty:
            return []
        return hazards_data.to_dict(orient="records")
    elif isinstance(hazards_data, list):
        return hazards_data
    return []


def is_route_blocked(
    route_coords: List[Tuple[float, float]],
    hazards: Union[List[Dict[str, Any]], Any],
    default_buffer_meters: float = 150.0
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Check if a route polyline intersects or comes within the threat radius of any active hazard.

    Returns:
    - is_blocked (bool): True if at least one hazard blocks the path.
    - blocking_hazards (list): List of hazard records causing the obstruction with distance details.
    """
    hazard_list = _extract_hazard_list(hazards)
    if not hazard_list or len(route_coords) < 2:
        return False, []

    # Pre-filter inactive hazards ONCE
    active_hazards = [
        h for h in hazard_list
        if str(h.get("is_active", True)).lower() not in ["false", "0", "no"]
    ]

    blocking_hazards = []

    for h in active_hazards:
        try:
            h_lat = float(h["latitude"])
            h_lon = float(h["longitude"])
        except (KeyError, ValueError, TypeError):
            continue

        buffer_zone = float(h.get("severity_radius_meters", default_buffer_meters) or default_buffer_meters)
        min_dist_to_route = float("inf")

        # Check distance to each segment of the route
        for i in range(len(route_coords) - 1):
            seg_start = route_coords[i]
            seg_end = route_coords[i + 1]
            dist = point_to_segment_distance((h_lat, h_lon), seg_start, seg_end, margin=buffer_zone)
            if dist < min_dist_to_route:
                min_dist_to_route = dist

        if min_dist_to_route <= buffer_zone:
            block_info = dict(h)
            block_info["distance_to_route_m"] = round(min_dist_to_route, 1)
            block_info["threat_radius_m"] = buffer_zone
            blocking_hazards.append(block_info)

    return (len(blocking_hazards) > 0), blocking_hazards


def evaluate_all_corridors(
    corridors: List[Dict[str, Any]],
    hazards: Union[List[Dict[str, Any]], Any]
) -> List[Dict[str, Any]]:
    """
    Evaluate primary and alternate routes for all emergency corridors against active hazards.

    Statuses assigned:
    - PRIMARY_ACTIVE: Primary route is safe and unobstructed (Green).
    - DETOUR_ACTIVE: Primary is blocked, but alternate route is clear (Blue).
    - ALL_BLOCKED: Both primary and alternate routes are compromised (Red).
    """
    hazard_list = _extract_hazard_list(hazards)
    active_hazards = [
        h for h in hazard_list
        if str(h.get("is_active", True)).lower() not in ["false", "0", "no"]
    ]
    
    evaluated = []

    for corr in corridors:
        corr_eval = dict(corr)
        primary_coords = [tuple(p) for p in corr.get("primary_route", [])]
        alt_coords = [tuple(p) for p in corr.get("alternate_route", [])]

        primary_blocked, primary_blockers = is_route_blocked(primary_coords, active_hazards)
        alt_blocked, alt_blockers = is_route_blocked(alt_coords, active_hazards)

        corr_eval["primary_blocked"] = primary_blocked
        corr_eval["primary_blockers"] = primary_blockers
        corr_eval["alt_blocked"] = alt_blocked
        corr_eval["alt_blockers"] = alt_blockers

        if not primary_blocked:
            corr_eval["status"] = "PRIMARY_ACTIVE"
            corr_eval["status_label"] = "Primary Route Safe"
            corr_eval["status_color"] = "green"
            corr_eval["active_path"] = primary_coords
            corr_eval["description"] = f"Safe corridor open between {corr.get('origin')} and {corr.get('destination')}."
        elif not alt_blocked:
            corr_eval["status"] = "DETOUR_ACTIVE"
            corr_eval["status_label"] = "Detour Active (Primary Blocked)"
            corr_eval["status_color"] = "blue"
            corr_eval["active_path"] = alt_coords
            corr_eval["description"] = (
                f"Primary path blocked by {len(primary_blockers)} hazard(s). "
                f"Active detour in effect via alternate corridor."
            )
        else:
            corr_eval["status"] = "ALL_BLOCKED"
            corr_eval["status_label"] = "CRITICAL: All Paths Blocked"
            corr_eval["status_color"] = "red"
            corr_eval["active_path"] = primary_coords
            corr_eval["description"] = (
                f"Hazard alert! Both primary and alternate corridors are blocked. Immediate rescue clearance needed."
            )

        evaluated.append(corr_eval)

    return evaluated
