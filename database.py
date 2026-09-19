"""
SurakshaSetu - Comprehensive Database Layer (database.py)
Designed for: Vinhack 2026 (VIT Vellore)
Role: Member 2 (Database Architect / Backend 1)

This module provides complete SQLite database initialization and pure Python CRUD operations
returning Pandas DataFrames. It is optimized for Streamlit dashboards, Folium maps, and volunteer apps.

Key Modules & Features:
1. Core Disaster Tables (SOS Requests, Hazard Reports, Shelters)
2. Smart Urgency Scoring & Auto Priority Color Tags (Red / Orange / Yellow)
3. Family / Group Check-in & Status Tracking
4. Volunteer Registration & SOS Mission Assignment
5. Shelter Live Status (Beds, Food, Water, Medical Supplies)
6. Non-Emergency Resource Request Board (Food, Water, Supplies)
7. Offline SOS Queue & Sync Engine
8. Nearest Shelter Haversine Distance Engine
9. Dashboard KPI Summary Generator
10. Multilingual UI Localization Dictionary (English, Tamil, Hindi)
11. Realistic VIT Vellore / Katpadi Disaster Mock Seeder
"""

import sqlite3
import json
import uuid
import math
from datetime import datetime
from typing import Dict, Any, Optional, List
import pandas as pd

# Default SQLite database file
DB_PATH = "surakshasetu.db"


def get_db_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    """
    Creates and returns an SQLite database connection with row factory enabled.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

from contextlib import contextmanager

@contextmanager
def db_connection(db_path: str = DB_PATH):
    """Context manager for safe database connections with auto-commit and cleanup."""
    conn = get_db_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ============================================================================
# 1. GEO-DISTANCE & PRIORITY HELPER ALGORITHMS
# ============================================================================

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two coordinates in kilometers using Haversine formula.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def calculate_urgency_score(
    people_count: int = 1,
    medical_need: bool = False,
    vulnerable_infants: int = 0,
    vulnerable_elderly: int = 0,
    vulnerable_pregnant: int = 0,
    base_urgency: Optional[float] = None
) -> float:
    """
    Computes a realistic 1-100 disaster urgency score.
    """
    if base_urgency is not None:
        return max(1.0, min(100.0, float(base_urgency)))

    score = 20.0
    if medical_need:
        score += 35.0

    score += min(20.0, int(people_count or 1) * 3.0)
    score += min(20.0, int(vulnerable_infants or 0) * 10.0)
    score += min(20.0, int(vulnerable_pregnant or 0) * 10.0)
    score += min(15.0, int(vulnerable_elderly or 0) * 5.0)

    return float(max(1.0, min(100.0, round(score, 1))))


def assign_priority_badge(urgency_score: float, medical_need: int = 0, infants: int = 0, pregnant: int = 0) -> Dict[str, str]:
    """
    Returns priority classification, color hex, and badge for Streamlit cards & Folium pins.
    Feature 5: Auto Priority Colour on SOS (Red / Orange / Yellow).
    """
    if urgency_score >= 70.0 or medical_need == 1 or infants > 0 or pregnant > 0:
        return {
            "priority_level": "CRITICAL",
            "priority_color": "#E63946",  # Red
            "badge": "🚨 Critical (Red)",
            "map_marker_color": "red"
        }
    elif urgency_score >= 40.0:
        return {
            "priority_level": "HIGH",
            "priority_color": "#FB8500",  # Orange
            "badge": "⚠️ High (Orange)",
            "map_marker_color": "orange"
        }
    else:
        return {
            "priority_level": "MODERATE",
            "priority_color": "#FFB703",  # Yellow
            "badge": "🟡 Moderate (Yellow)",
            "map_marker_color": "gold"
        }


def _severity_to_radius(severity: str) -> float:
    """Maps severity text to a numerical radius in meters for routing engine."""
    return {"Critical": 300.0, "High": 200.0, "Medium": 150.0, "Low": 50.0}.get(severity, 150.0)


# ============================================================================
# 2. SCHEMA INITIALIZATION (create_tables)
# ============================================================================

def create_tables(db_path: str = DB_PATH) -> None:
    """
    Initializes all SQLite database tables with complete schemas and indexes.
    Safe to execute multiple times (uses IF NOT EXISTS).
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        # --- Core 1: SOS Distress Requests ---
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sos_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_name TEXT NOT NULL,
            contact_number TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            location_name TEXT,
            people_count INTEGER DEFAULT 1,
            medical_need INTEGER DEFAULT 0,
            vulnerable_infants INTEGER DEFAULT 0,
            vulnerable_elderly INTEGER DEFAULT 0,
            vulnerable_pregnant INTEGER DEFAULT 0,
            urgency_score REAL DEFAULT 20.0,
            description TEXT,
            water_depth TEXT DEFAULT 'Unknown',            -- Ground Floor, First Floor, Roof Top, Unknown
            status TEXT DEFAULT 'Pending',             -- Pending, Assigned, In Progress, Resolved, Cancelled
            assigned_volunteer_id INTEGER,
            assigned_volunteer_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # --- Core 2: Hazard / Incident Reports ---
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS hazard_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hazard_type TEXT NOT NULL,                 -- Flooded Road, Fallen Tree, Landslide, Live Wire, etc.
            severity TEXT DEFAULT 'Medium',            -- Low, Medium, High, Critical
            severity_radius_meters REAL DEFAULT 150.0, -- Danger buffer radius in meters
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            location_name TEXT,
            description TEXT,
            reported_by TEXT,
            contact_number TEXT,
            is_active INTEGER DEFAULT 1,               -- 1 = Active, 0 = Resolved
            status TEXT DEFAULT 'Active',              -- Active, Verified, In Progress, Resolved
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # --- Core 3: Emergency Relief Shelters & Live Supplies ---
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS shelters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location_name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            total_capacity INTEGER NOT NULL,
            current_occupancy INTEGER DEFAULT 0,
            available_beds INTEGER DEFAULT 0,
            food_status TEXT DEFAULT 'Sufficient',     -- Sufficient, Moderate, Low, Critical, None
            water_status TEXT DEFAULT 'Sufficient',    -- Sufficient, Moderate, Low, Critical, None
            medical_supply_status TEXT DEFAULT 'Good', -- Good, Moderate, Low, Critical
            contact_person TEXT,
            contact_number TEXT,
            facilities TEXT,
            status TEXT DEFAULT 'Open',                -- Open, Full, Closed
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # --- Feature 1: Family / Group Check-In ---
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS family_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_code TEXT UNIQUE NOT NULL,           -- e.g. "FAM-7890"
            group_name TEXT NOT NULL,                  -- e.g. "Sharma Family"
            creator_name TEXT,
            creator_phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS family_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_code TEXT NOT NULL,
            member_name TEXT NOT NULL,
            phone_number TEXT,
            status TEXT DEFAULT 'Safe',                -- 'Safe', 'Need Help', 'Sheltered', 'Unknown'
            last_known_latitude REAL,
            last_known_longitude REAL,
            location_name TEXT,
            health_note TEXT,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_code) REFERENCES family_groups(group_code) ON DELETE CASCADE
        );
        """)

        # --- Feature 2: Volunteer Registry & Task Dispatch ---
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS volunteers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            skills TEXT,                               -- e.g. "First Aid, Swimmer, Boat Driver, Nurse"
            vehicle_type TEXT,                         -- "None", "Motorcycle", "4x4 Jeep", "Rescue Boat"
            current_latitude REAL,
            current_longitude REAL,
            is_available INTEGER DEFAULT 1,            -- 1 = Available, 0 = Busy
            tasks_completed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # --- Feature 4: Resource Request Board (Non-Emergency Supplies) ---
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS resource_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requester_name TEXT NOT NULL,
            contact_number TEXT NOT NULL,
            category TEXT NOT NULL,                    -- Food, Drinking Water, Non-Critical Medicine, Clothing, Baby Essentials
            items_needed TEXT NOT NULL,
            quantity TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            location_name TEXT,
            status TEXT DEFAULT 'Open',                -- Open, In Transit, Fulfilled, Closed
            fulfilled_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # --- Feature 6: Offline SOS Queue ---
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS offline_sos_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payload_json TEXT NOT NULL,
            queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sync_status TEXT DEFAULT 'Pending',        -- Pending, Synced, Failed
            synced_at TIMESTAMP,
            error_message TEXT
        );
        """)

        # Database Indexes for Instant Performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sos_urgency ON sos_requests(urgency_score DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sos_status ON sos_requests(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_hazard_status ON hazard_reports(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_shelters_status ON shelters(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_family_group_code ON family_members(group_code);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_volunteer_avail ON volunteers(is_available);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_resource_status ON resource_requests(status);")


# ============================================================================
# 3. SOS OPERATIONS & AUTO PRIORITY BADGES
# ============================================================================

def insert_sos(data: Dict[str, Any], db_path: str = DB_PATH) -> int:
    """
    Inserts a new SOS emergency request. Urgency score is auto-calculated.
    """
    people_count = int(data.get("people_count", 1) or 1)
    medical_need = 1 if data.get("medical_need") in [True, 1, "1", "true", "True"] else 0
    infants = int(data.get("vulnerable_infants", 0) or 0)
    elderly = int(data.get("vulnerable_elderly", 0) or 0)
    pregnant = int(data.get("vulnerable_pregnant", 0) or 0)

    urgency_score = calculate_urgency_score(
        people_count=people_count,
        medical_need=bool(medical_need),
        vulnerable_infants=infants,
        vulnerable_elderly=elderly,
        vulnerable_pregnant=pregnant,
        base_urgency=data.get("urgency_score")
    )

    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO sos_requests (
            sender_name, contact_number, latitude, longitude, location_name,
            people_count, medical_need, vulnerable_infants, vulnerable_elderly,
            vulnerable_pregnant, urgency_score, description, water_depth, status,
            assigned_volunteer_id, assigned_volunteer_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            data.get("sender_name", "Anonymous"),
            data.get("contact_number", "N/A"),
            float(data["latitude"]),
            float(data["longitude"]),
            data.get("location_name", "Unknown Location"),
            people_count,
            medical_need,
            infants,
            elderly,
            pregnant,
            urgency_score,
            data.get("description", ""),
            data.get("water_depth", "Unknown"),
            data.get("status", "Pending"),
            data.get("assigned_volunteer_id", None),
            data.get("assigned_volunteer_name", None),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        sos_id = cursor.lastrowid
    return sos_id


def get_all_sos_as_dataframe(status_filter: Optional[str] = None, db_path: str = DB_PATH) -> pd.DataFrame:
    """
    Fetches all SOS records as a Pandas DataFrame sorted by urgency_score descending.
    Adds Feature 5 columns: 'priority_level', 'priority_color', 'badge', 'map_marker_color'.
    """
    query = "SELECT * FROM sos_requests"
    params = []

    if status_filter:
        query += " WHERE status = ?"
        params.append(status_filter)

    query += " ORDER BY urgency_score DESC, created_at DESC;"

    with db_connection(db_path) as conn:
        df = pd.read_sql_query(query, conn, params=params)

    if not df.empty:
        badges = df.apply(
            lambda row: assign_priority_badge(
                row["urgency_score"],
                row["medical_need"],
                row["vulnerable_infants"],
                row["vulnerable_pregnant"]
            ),
            axis=1
        )
        badge_df = pd.DataFrame(badges.tolist())
        df = pd.concat([df, badge_df], axis=1)

    return df


def update_sos_status(sos_id: int, new_status: str, db_path: str = DB_PATH) -> bool:
    """
    Updates status of an SOS request ('Pending', 'In Progress', 'Resolved', 'Cancelled').
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE sos_requests
        SET status = ?, updated_at = ?
        WHERE id = ?;
        """, (new_status, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), int(sos_id)))

        updated = cursor.rowcount > 0
    return updated


# ============================================================================
# 4. HAZARD & INCIDENT OPERATIONS
# ============================================================================

def insert_hazard(data: Dict[str, Any], db_path: str = DB_PATH) -> int:
    """
    Inserts a new hazard or blocked road report.
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO hazard_reports (
            hazard_type, severity, severity_radius_meters, latitude, longitude, location_name,
            description, reported_by, contact_number, is_active, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            data.get("hazard_type", "General Hazard"),
            data.get("severity", "Medium"),
            float(data.get("severity_radius_meters", _severity_to_radius(data.get("severity", "Medium")))),
            float(data["latitude"]),
            float(data["longitude"]),
            data.get("location_name", "Unknown Location"),
            data.get("description", ""),
            data.get("reported_by", "Citizen"),
            data.get("contact_number", "N/A"),
            1 if data.get("is_active", True) not in [False, 0, "0", "false", "False"] else 0,
            data.get("status", "Active"),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        hazard_id = cursor.lastrowid
    return hazard_id


def get_all_hazards_as_dataframe(status_filter: Optional[str] = None, db_path: str = DB_PATH) -> pd.DataFrame:
    """
    Fetches all hazard reports as a Pandas DataFrame.
    """
    query = "SELECT * FROM hazard_reports"
    params = []

    if status_filter:
        query += " WHERE status = ?"
        params.append(status_filter)

    query += " ORDER BY created_at DESC;"

    with db_connection(db_path) as conn:
        df = pd.read_sql_query(query, conn, params=params)
    return df


def update_hazard_status(hazard_id: int, new_status: str, db_path: str = DB_PATH) -> bool:
    """
    Updates the status of a hazard report (e.g., 'Active' -> 'Resolved').
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE hazard_reports SET status = ? WHERE id = ?;", (new_status, int(hazard_id)))
        updated = cursor.rowcount > 0
    return updated


# ============================================================================
# 5. SHELTER OPERATIONS & LIVE SUPPLY STATUS
# ============================================================================

def insert_shelter(data: Dict[str, Any], db_path: str = DB_PATH) -> int:
    """
    Inserts a relief shelter.
    """
    total_capacity = int(data.get("total_capacity", 100))
    current_occupancy = int(data.get("current_occupancy", 0))
    available_beds = max(0, total_capacity - current_occupancy)

    status = data.get("status", "Open")
    if current_occupancy >= total_capacity and status == "Open":
        status = "Full"

    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO shelters (
            name, location_name, latitude, longitude, total_capacity,
            current_occupancy, available_beds, food_status, water_status,
            medical_supply_status, contact_person, contact_number, facilities,
            status, last_updated, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            data.get("name", "Emergency Relief Shelter"),
            data.get("location_name", "Vellore"),
            float(data["latitude"]),
            float(data["longitude"]),
            total_capacity,
            current_occupancy,
            available_beds,
            data.get("food_status", "Sufficient"),
            data.get("water_status", "Sufficient"),
            data.get("medical_supply_status", "Good"),
            data.get("contact_person", "Facility In-Charge"),
            data.get("contact_number", "N/A"),
            data.get("facilities", "Food, Water, First Aid"),
            status,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        shelter_id = cursor.lastrowid
        return shelter_id


def get_all_shelters_as_dataframe(only_open: bool = False, db_path: str = DB_PATH) -> pd.DataFrame:
    """
    Fetches all shelters as a Pandas DataFrame with computed available capacity and occupancy rate.
    """
    query = "SELECT * FROM shelters"
    params = []

    if only_open:
        query += " WHERE status = 'Open' AND current_occupancy < total_capacity"

    query += " ORDER BY (total_capacity - current_occupancy) DESC;"

    with db_connection(db_path) as conn:
        df = pd.read_sql_query(query, conn, params=params)

    if not df.empty:
        df["available_capacity"] = df["total_capacity"] - df["current_occupancy"]
        df["occupancy_rate"] = ((df["current_occupancy"] / df["total_capacity"]) * 100).round(1)

    return df


def update_shelter_live_status(
    shelter_id: int,
    current_occupancy: Optional[int] = None,
    available_beds: Optional[int] = None,
    food_status: Optional[str] = None,
    water_status: Optional[str] = None,
    medical_supply_status: Optional[str] = None,
    db_path: str = DB_PATH
) -> bool:
    """
    Feature 3: Shelter Live Status Update.
    Allows shelter managers to quickly update occupancy, available beds, food, and water status.
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT total_capacity, current_occupancy, available_beds, food_status, water_status, medical_supply_status FROM shelters WHERE id = ?", (int(shelter_id),))
        row = cursor.fetchone()
        if not row:
            return False

        tot_cap = row["total_capacity"]
        new_occ = current_occupancy if current_occupancy is not None else row["current_occupancy"]
        new_beds = available_beds if available_beds is not None else max(0, tot_cap - new_occ)
        new_food = food_status if food_status is not None else row["food_status"]
        new_water = water_status if water_status is not None else row["water_status"]
        new_med = medical_supply_status if medical_supply_status is not None else row["medical_supply_status"]
        new_status = "Full" if new_occ >= tot_cap else "Open"

        cursor.execute("""
        UPDATE shelters
        SET current_occupancy = ?, available_beds = ?, food_status = ?,
            water_status = ?, medical_supply_status = ?, status = ?,
            last_updated = ?
        WHERE id = ?;
        """, (
            int(new_occ),
            int(new_beds),
            new_food,
            new_water,
            new_med,
            new_status,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            int(shelter_id)
        ))

        updated = cursor.rowcount > 0
    return updated


def find_nearest_shelters(user_lat: float, user_lon: float, top_k: int = 3, db_path: str = DB_PATH) -> pd.DataFrame:
    """
    Finds and ranks the closest open shelters with available capacity relative to a GPS point.
    """
    df_shelters = get_all_shelters_as_dataframe(only_open=True, db_path=db_path)
    if df_shelters.empty:
        return pd.DataFrame()

    df_shelters["distance_km"] = df_shelters.apply(
        lambda r: haversine_distance_km(user_lat, user_lon, r["latitude"], r["longitude"]),
        axis=1
    )
    df_sorted = df_shelters.sort_values(by="distance_km", ascending=True).head(top_k)
    return df_sorted


# ============================================================================
# 6. FEATURE 1: FAMILY / GROUP CHECK-IN
# ============================================================================

def create_family_group(group_name: str, creator_name: str = "Family Admin", creator_phone: str = "N/A", db_path: str = DB_PATH) -> str:
    """
    Creates a new family or community group and generates a unique group code (e.g. FAM-4821).
    """
    code = f"FAM-{uuid.uuid4().hex[:8]}"
    with db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO family_groups (group_code, group_name, creator_name, creator_phone, created_at)
        VALUES (?, ?, ?, ?, ?);
        """, (code, group_name, creator_name, creator_phone, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    return code


def add_or_update_family_member(data: Dict[str, Any], db_path: str = DB_PATH) -> int:
    """
    Adds a member to a family group or updates their safety status ('Safe', 'Need Help', 'Sheltered').
    
    Expected keys:
        - group_code (str) [Required]
        - member_name (str) [Required]
        - status (str, default='Safe') ('Safe', 'Need Help', 'Sheltered', 'Unknown')
        - phone_number (str, optional)
        - last_known_latitude (float, optional)
        - last_known_longitude (float, optional)
        - location_name (str, optional)
        - health_note (str, optional)
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        # Check if member already exists in group
        cursor.execute("""
        SELECT id FROM family_members WHERE group_code = ? AND member_name = ?;
        """, (data["group_code"], data["member_name"]))
        existing = cursor.fetchone()

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        if existing:
            member_id = existing["id"]
            cursor.execute("""
            UPDATE family_members
            SET status = ?, phone_number = ?, last_known_latitude = ?,
                last_known_longitude = ?, location_name = ?, health_note = ?, last_updated = ?
            WHERE id = ?;
            """, (
                data.get("status", "Safe"),
                data.get("phone_number", "N/A"),
                data.get("last_known_latitude"),
                data.get("last_known_longitude"),
                data.get("location_name", ""),
                data.get("health_note", ""),
                now_str,
                member_id
            ))
        else:
            cursor.execute("""
            INSERT INTO family_members (
                group_code, member_name, phone_number, status,
                last_known_latitude, last_known_longitude, location_name,
                health_note, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                data["group_code"],
                data["member_name"],
                data.get("phone_number", "N/A"),
                data.get("status", "Safe"),
                data.get("last_known_latitude"),
                data.get("last_known_longitude"),
                data.get("location_name", ""),
                data.get("health_note", ""),
                now_str
            ))
            member_id = cursor.lastrowid

        return member_id


def get_family_members_as_dataframe(group_code: str, db_path: str = DB_PATH) -> pd.DataFrame:
    """
    Retrieves all members of a family group as a Pandas DataFrame.
    """
    query = """
    SELECT m.*, g.group_name
    FROM family_members m
    JOIN family_groups g ON m.group_code = g.group_code
    WHERE m.group_code = ?
    ORDER BY m.last_updated DESC;
    """
    with db_connection(db_path) as conn:
        df = pd.read_sql_query(query, conn, params=[group_code])
    return df


# ============================================================================
# 7. FEATURE 2: VOLUNTEER MODE & TASK ACCEPTANCE
# ============================================================================

def register_volunteer(data: Dict[str, Any], db_path: str = DB_PATH) -> int:
    """
    Registers a new volunteer (e.g. swimmer, nurse, first responder, boat driver).
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO volunteers (
            name, phone_number, skills, vehicle_type,
            current_latitude, current_longitude, is_available, tasks_completed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            data.get("name", "Volunteer"),
            data.get("phone_number", "N/A"),
            data.get("skills", "General Assistance"),
            data.get("vehicle_type", "None"),
            data.get("current_latitude", 12.9716),
            data.get("current_longitude", 79.1590),
            1 if data.get("is_available", True) else 0,
            0,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        vol_id = cursor.lastrowid
        return vol_id


def get_all_volunteers_as_dataframe(only_available: bool = False, db_path: str = DB_PATH) -> pd.DataFrame:
    """
    Fetches volunteers as a Pandas DataFrame.
    """
    query = "SELECT * FROM volunteers"
    params = []

    if only_available:
        query += " WHERE is_available = 1"

    query += " ORDER BY tasks_completed DESC;"
    with db_connection(db_path) as conn:
        df = pd.read_sql_query(query, conn, params=params)
    return df


def accept_sos_task(sos_id: int, volunteer_id: int, volunteer_name: str, db_path: str = DB_PATH) -> bool:
    """
    Allows a volunteer to accept an unassigned SOS rescue task.
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE sos_requests
        SET status = 'Assigned', assigned_volunteer_id = ?, assigned_volunteer_name = ?, updated_at = ?
        WHERE id = ? AND (status = 'Pending' OR status = 'Assigned');
        """, (int(volunteer_id), volunteer_name, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), int(sos_id)))

        assigned = cursor.rowcount > 0

        if assigned:
            # Mark volunteer as temporarily busy
            cursor.execute("UPDATE volunteers SET is_available = 0 WHERE id = ?;", (int(volunteer_id),))

        return assigned


def get_nearby_unassigned_sos_as_dataframe(
    volunteer_lat: float,
    volunteer_lon: float,
    radius_km: float = 15.0,
    db_path: str = DB_PATH
) -> pd.DataFrame:
    """
    Returns unassigned/pending SOS requests within radius_km sorted by closest distance & urgency.
    """
    df_sos = get_all_sos_as_dataframe(status_filter="Pending", db_path=db_path)
    if df_sos.empty:
        return pd.DataFrame()

    df_sos["distance_km"] = df_sos.apply(
        lambda r: haversine_distance_km(volunteer_lat, volunteer_lon, r["latitude"], r["longitude"]),
        axis=1
    )

    df_filtered = df_sos[df_sos["distance_km"] <= radius_km].sort_values(
        by=["distance_km", "urgency_score"],
        ascending=[True, False]
    )
    return df_filtered


# ============================================================================
# 8. FEATURE 4: RESOURCE REQUEST BOARD (NON-EMERGENCY NEEDS)
# ============================================================================

def insert_resource_request(data: Dict[str, Any], db_path: str = DB_PATH) -> int:
    """
    Inserts a non-emergency resource request (Food, Water, Medicine, Baby Formula).
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO resource_requests (
            requester_name, contact_number, category, items_needed,
            quantity, latitude, longitude, location_name, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            data.get("requester_name", "Citizen"),
            data.get("contact_number", "N/A"),
            data.get("category", "Food"),
            data.get("items_needed", ""),
            data.get("quantity", "1 unit"),
            float(data["latitude"]),
            float(data["longitude"]),
            data.get("location_name", "Vellore"),
            data.get("status", "Open"),
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

        req_id = cursor.lastrowid
        return req_id


def get_all_resource_requests_as_dataframe(
    category_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    db_path: str = DB_PATH
) -> pd.DataFrame:
    """
    Fetches all non-emergency resource requests as a Pandas DataFrame.
    """
    query = "SELECT * FROM resource_requests WHERE 1=1"
    params = []

    if category_filter:
        query += " AND category = ?"
        params.append(category_filter)

    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)

    query += " ORDER BY created_at DESC;"

    with db_connection(db_path) as conn:
        df = pd.read_sql_query(query, conn, params=params)
    return df


def update_resource_request_status(request_id: int, new_status: str, fulfilled_by: str = "", db_path: str = DB_PATH) -> bool:
    """
    Updates the fulfillment status of a resource request ('Open' -> 'In Transit' -> 'Fulfilled').
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        UPDATE resource_requests
        SET status = ?, fulfilled_by = ?
        WHERE id = ?;
        """, (new_status, fulfilled_by, int(request_id)))

        updated = cursor.rowcount > 0
        return updated


# ============================================================================
# 9. FEATURE 6: OFFLINE SOS QUEUE & SYNC ENGINE
# ============================================================================

def enqueue_offline_sos(payload_dict: Dict[str, Any], db_path: str = DB_PATH) -> int:
    """
    Saves an SOS request to a local offline queue when internet is disconnected.
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO offline_sos_queue (payload_json, queued_at, sync_status)
        VALUES (?, ?, 'Pending');
        """, (json.dumps(payload_dict), datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

        queue_id = cursor.lastrowid
        return queue_id


def sync_offline_sos_queue(db_path: str = DB_PATH) -> int:
    """
    Processes all queued offline SOS entries and automatically inserts them into the live sos_requests table.
    Returns the number of successfully synced requests.
    """
    with db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, payload_json FROM offline_sos_queue WHERE sync_status = 'Pending';")
        pending_items = cursor.fetchall()
        
        synced_count = 0
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for item in pending_items:
            queue_id = item["id"]
            try:
                data = json.loads(item["payload_json"])
                
                # Inlined insert_sos logic to avoid new connections
                people_count = int(data.get("people_count", 1) or 1)
                medical_need = 1 if data.get("medical_need") in [True, 1, "1", "true", "True"] else 0
                infants = int(data.get("vulnerable_infants", 0) or 0)
                elderly = int(data.get("vulnerable_elderly", 0) or 0)
                pregnant = int(data.get("vulnerable_pregnant", 0) or 0)

                urgency_score = calculate_urgency_score(
                    people_count=people_count,
                    medical_need=bool(medical_need),
                    vulnerable_infants=infants,
                    vulnerable_elderly=elderly,
                    vulnerable_pregnant=pregnant,
                    base_urgency=data.get("urgency_score")
                )

                cursor.execute("""
                INSERT INTO sos_requests (
                    sender_name, contact_number, latitude, longitude, location_name,
                    people_count, medical_need, vulnerable_infants, vulnerable_elderly,
                    vulnerable_pregnant, urgency_score, description, status,
                    assigned_volunteer_id, assigned_volunteer_name, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    data.get("sender_name", "Anonymous"),
                    data.get("contact_number", "N/A"),
                    float(data["latitude"]),
                    float(data["longitude"]),
                    data.get("location_name", "Unknown Location"),
                    people_count,
                    medical_need,
                    infants,
                    elderly,
                    pregnant,
                    urgency_score,
                    data.get("description", ""),
                    data.get("status", "Pending"),
                    data.get("assigned_volunteer_id", None),
                    data.get("assigned_volunteer_name", None),
                    now_str,
                    now_str
                ))
                
                cursor.execute("UPDATE offline_sos_queue SET sync_status = 'Synced', synced_at = ? WHERE id = ?;", (now_str, queue_id))
                synced_count += 1
            except Exception as e:
                cursor.execute("UPDATE offline_sos_queue SET sync_status = 'Failed', error_message = ? WHERE id = ?;", (str(e), queue_id))

    return synced_count


# ============================================================================
# 10. DASHBOARD KPI SUMMARY ENGINE
# ============================================================================

def get_dashboard_summary_metrics(db_path: str = DB_PATH) -> Dict[str, Any]:
    """
    Returns aggregated metrics for Streamlit KPI metric cards in a single fast call.
    """
    query = """
    SELECT 
        (SELECT COUNT(*) FROM sos_requests WHERE status NOT IN ('Resolved','Cancelled')) as active_sos,
        (SELECT COALESCE(SUM(people_count),0) FROM sos_requests WHERE status NOT IN ('Resolved','Cancelled')) as total_people,
        (SELECT COALESCE(SUM(medical_need),0) FROM sos_requests WHERE status NOT IN ('Resolved','Cancelled')) as med_cases,
        (SELECT COUNT(*) FROM hazard_reports WHERE status = 'Active') as active_hazards,
        (SELECT COALESCE(SUM(total_capacity),0) FROM shelters WHERE status = 'Open') as cap,
        (SELECT COALESCE(SUM(current_occupancy),0) FROM shelters WHERE status = 'Open') as occ,
        (SELECT COALESCE(SUM(available_beds),0) FROM shelters WHERE status = 'Open') as beds,
        (SELECT COUNT(*) FROM shelters WHERE status = 'Open') as shelter_count,
        (SELECT COUNT(*) FROM volunteers WHERE is_available = 1) as avail_volunteers
    """
    
    with db_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        row = cursor.fetchone()

    total_cap = row["cap"]
    total_occ = row["occ"]
    avail_beds = row["beds"] if row["beds"] > 0 else max(0, total_cap - total_occ)

    return {
        "active_sos_count": row["active_sos"],
        "total_people_stranded": row["total_people"],
        "critical_medical_cases": row["med_cases"],
        "active_hazards": row["active_hazards"],
        "open_shelters": row["shelter_count"],
        "total_shelter_capacity": total_cap,
        "total_shelter_occupancy": total_occ,
        "available_shelter_beds": avail_beds,
        "shelter_occupancy_pct": round((total_occ / total_cap * 100), 1) if total_cap > 0 else 0.0,
        "available_volunteers": row["avail_volunteers"]
    }


# ============================================================================
# 11. FEATURE 7: MULTILINGUAL UI DICTIONARY (EN, TA, HI)
# ============================================================================

def get_ui_dictionary(lang: str = "en") -> Dict[str, str]:
    """
    Provides lightweight internationalization dictionary for English, Tamil (தமிழ்), and Hindi (हिंदी).
    """
    translations = {
        "en": {
            "app_title": "SurakshaSetu - Disaster Management System",
            "sos_button": "🚨 SEND SOS EMERGENCY",
            "hazard_alert": "⚠️ Report Road / Hazard Blockage",
            "find_shelter": "🏠 Find Nearest Open Shelter",
            "family_checkin": "👨‍👩‍👧 Family Safety Status Check-In",
            "volunteer_mode": "🤝 Volunteer Action Center",
            "resource_board": "📦 Relief Supplies & Resource Board",
            "pending_status": "Pending",
            "resolved_status": "Resolved",
            "critical_badge": "🚨 Critical Priority",
            "high_badge": "⚠️ High Priority",
            "moderate_badge": "🟡 Moderate Priority"
        },
        "ta": {
            "app_title": "சுரக்ஷாசேது - பேரிடர் மேலாண்மை செயலி",
            "sos_button": "🚨 அவசர உதவி கோரிக்கை (SOS)",
            "hazard_alert": "⚠️ சாலை ஆபத்து / வெள்ள எச்சரிக்கை",
            "find_shelter": "🏠 அருகிலுள்ள நிவாரண முகாம்",
            "family_checkin": "👨‍👩‍👧 குடும்ப பாதுகாப்பு நிலை",
            "volunteer_mode": "🤝 தன்னார்வலர் மையம்",
            "resource_board": "📦 நிவாரண பொருட்கள் கோரிக்கை",
            "pending_status": "நிலுவையில் உள்ளது",
            "resolved_status": "தீர்க்கப்பட்டது",
            "critical_badge": "🚨 மிக அவசரம் (சிவப்பு)",
            "high_badge": "⚠️ அதிக முன்னுரிமை (ஆரஞ்சு)",
            "moderate_badge": "🟡 மிதமான முன்னுரிமை (மஞ்சள்)"
        },
        "hi": {
            "app_title": "सुरक्षासेतु - आपदा प्रबंधन प्रणाली",
            "sos_button": "🚨 आपातकालीन सहायता (SOS)",
            "hazard_alert": "⚠️ खतरे / सड़क रुकावट की सूचना दें",
            "find_shelter": "🏠 निकटतम राहत शिविर खोजें",
            "family_checkin": "👨‍👩‍👧 परिवार सुरक्षा स्थिति चेक-इन",
            "volunteer_mode": "🤝 स्वयंसेवक सहायता केंद्र",
            "resource_board": "📦 राहत सामग्री एवं संसाधन बोर्ड",
            "pending_status": "लंबित",
            "resolved_status": "समाधानित",
            "critical_badge": "🚨 अति गंभीर (लाल)",
            "high_badge": "⚠️ उच्च प्राथमिकता (नारंगी)",
            "moderate_badge": "🟡 मध्यम प्राथमिकता (पीला)"
        }
    }
    return translations.get(lang.lower(), translations["en"])


# ============================================================================
# 12. HACKATHON DEMO / SEED DATA GENERATOR
# ============================================================================

def seed_mock_data(db_path: str = DB_PATH) -> None:
    """
    Seeds initial realistic mock data centered around VIT Vellore / Katpadi area
    for immediate hackathon testing and live dashboard demo.
    """
    create_tables(db_path)

    # 1. Mock SOS Requests
    sos_samples = [
        {
            "sender_name": "Ramesh Kumar",
            "contact_number": "+91 98765 43210",
            "latitude": 12.9716,
            "longitude": 79.1590,
            "location_name": "Near VIT Main Gate, Katpadi",
            "people_count": 4,
            "medical_need": 1,
            "vulnerable_infants": 1,
            "vulnerable_elderly": 1,
            "vulnerable_pregnant": 0,
            "water_depth": "chest",
            "description": "Ground floor flooded up to 4 feet. Elderly father needs insulin immediately.",
            "status": "Pending"
        },
        {
            "sender_name": "Priya Sharma",
            "contact_number": "+91 91234 56789",
            "latitude": 12.9680,
            "longitude": 79.1520,
            "location_name": "Katpadi Railway Station Road",
            "people_count": 2,
            "medical_need": 0,
            "vulnerable_infants": 0,
            "vulnerable_elderly": 0,
            "vulnerable_pregnant": 1,
            "water_depth": "knee",
            "description": "Trapped on terrace, drinking water depleted. Pregnant woman in 8th month.",
            "status": "In Progress"
        },
        {
            "sender_name": "Karthik R",
            "contact_number": "+91 99440 12345",
            "latitude": 12.9780,
            "longitude": 79.1430,
            "location_name": "Gandhi Nagar, 4th East Main",
            "people_count": 6,
            "medical_need": 0,
            "vulnerable_infants": 0,
            "vulnerable_elderly": 2,
            "vulnerable_pregnant": 0,
            "water_depth": "waist",
            "description": "Water level rising rapidly, need evacuation boat.",
            "status": "Pending"
        }
    ]

    for sos in sos_samples:
        insert_sos(sos, db_path)

    # 2. Mock Hazards
    hazard_samples = [
        {
            "hazard_type": "Flooded Road",
            "severity": "Critical",
            "severity_radius_meters": 300.0,
            "latitude": 12.9735,
            "longitude": 79.1560,
            "location_name": "Katpadi Flyover Underpass",
            "description": "5 feet water logging, completely impassable for four-wheelers.",
            "reported_by": "Traffic Police Ward 3",
            "contact_number": "+91 94433 11223",
            "status": "Active"
        },
        {
            "hazard_type": "Fallen Tree & Live Wire",
            "severity": "High",
            "severity_radius_meters": 200.0,
            "latitude": 12.9650,
            "longitude": 79.1620,
            "location_name": "Sripuram Road Junction",
            "description": "Banyan tree collapsed over live electrical wires, blocking emergency lanes.",
            "reported_by": "Volunteer Anitha",
            "contact_number": "+91 98844 55667",
            "status": "Active"
        }
    ]

    for hazard in hazard_samples:
        insert_hazard(hazard, db_path)

    # 3. Mock Shelters with Live Supplies
    shelter_samples = [
        {
            "name": "VIT Indoor Sports Complex Shelter",
            "location_name": "VIT University, Katpadi",
            "latitude": 12.9692,
            "longitude": 79.1559,
            "total_capacity": 500,
            "current_occupancy": 140,
            "food_status": "Sufficient",
            "water_status": "Sufficient",
            "medical_supply_status": "Good",
            "contact_person": "Dr. S. Sundar (Disaster Relief Incharge)",
            "contact_number": "+91 94444 88888",
            "facilities": "Food Mess, RO Drinking Water, 24/7 Medical Clinic, DG Power Backup, 50 Restrooms",
            "status": "Open"
        },
        {
            "name": "Katpadi Government Higher Secondary School",
            "location_name": "Katpadi Main Road",
            "latitude": 12.9760,
            "longitude": 79.1480,
            "total_capacity": 250,
            "current_occupancy": 200,
            "food_status": "Moderate",
            "water_status": "Low",
            "medical_supply_status": "Moderate",
            "contact_person": "V. Murugan (Headmaster)",
            "contact_number": "+91 93333 77777",
            "facilities": "Food Packets, Bottled Water, First Aid, Sanitation",
            "status": "Open"
        }
    ]

    for shelter in shelter_samples:
        insert_shelter(shelter, db_path)

    # 4. Mock Family Group Check-in
    fam_code = create_family_group("Sharma Family", "Priya Sharma", "+91 91234 56789", db_path)
    add_or_update_family_member({
        "group_code": fam_code,
        "member_name": "Priya Sharma",
        "phone_number": "+91 91234 56789",
        "status": "Need Help",
        "last_known_latitude": 12.9680,
        "last_known_longitude": 79.1520,
        "location_name": "Katpadi Railway Road",
        "health_note": "Pregnant (8th month), safe on terrace."
    }, db_path)
    add_or_update_family_member({
        "group_code": fam_code,
        "member_name": "Rahul Sharma (Brother)",
        "phone_number": "+91 98888 11111",
        "status": "Safe",
        "last_known_latitude": 12.9692,
        "last_known_longitude": 79.1559,
        "location_name": "VIT Indoor Shelter",
        "health_note": "Checked into relief shelter, all fine."
    }, db_path)

    # 5. Mock Volunteers
    register_volunteer({
        "name": "Vikram Sethi",
        "phone_number": "+91 97777 22222",
        "skills": "First Aid Certified, Strong Swimmer",
        "vehicle_type": "Rescue Inflatable Boat",
        "current_latitude": 12.9700,
        "current_longitude": 79.1570,
        "is_available": 1
    }, db_path)
    register_volunteer({
        "name": "Dr. Sneha Reddy",
        "phone_number": "+91 96666 33333",
        "skills": "Emergency Doctor / Trauma Care",
        "vehicle_type": "4x4 Ambulance",
        "current_latitude": 12.9740,
        "current_longitude": 79.1510,
        "is_available": 1
    }, db_path)

    # 6. Mock Resource Requests (Non-Emergency)
    insert_resource_request({
        "requester_name": "Ward 5 Relief Camp",
        "contact_number": "+91 95555 44444",
        "category": "Drinking Water",
        "items_needed": "20-Liter Water Cans",
        "quantity": "50 cans",
        "latitude": 12.9750,
        "longitude": 79.1460,
        "location_name": "Chittoor Bus Stand Area",
        "status": "Open"
    }, db_path)
    insert_resource_request({
        "requester_name": "Community Care Center",
        "contact_number": "+91 94444 11122",
        "category": "Baby Essentials",
        "items_needed": "Baby Milk Powder & Diapers",
        "quantity": "25 boxes",
        "latitude": 12.9670,
        "longitude": 79.1540,
        "location_name": "Silk Mill Junction",
        "status": "Open"
    }, db_path)


if __name__ == "__main__":
    print("=" * 60)
    print("SURAKSHASETU DATABASE INITIALIZATION & SELF-TEST")
    print("=" * 60)
    create_tables()
    print("✓ All tables and indexes verified.")
    seed_mock_data()
    print("✓ Realistic Vinhack mock data seeded.")

    print("\n--- KPI METRICS SUMMARY ---")
    metrics = get_dashboard_summary_metrics()
    for k, v in metrics.items():
        print(f"  • {k}: {v}")

    print("\n--- SOS WITH AUTO-PRIORITY COLOR CODES ---")
    df_sos = get_all_sos_as_dataframe()
    print(df_sos[["id", "sender_name", "urgency_score", "badge", "priority_color", "status"]])
