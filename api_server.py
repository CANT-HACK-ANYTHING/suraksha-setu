"""
SurakshaSetu Zero-Dependency REST API Server
Binds the React frontend directly to Member 2's SQLite Database and Backend 2's Algorithms.
Runs on http://localhost:8000
"""

import json
import os
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Any, Dict, List
from urllib.parse import urlparse

# Import Database & Algorithm Modules
from database import (
    create_tables,
    seed_mock_data,
    get_all_sos_as_dataframe,
    insert_sos,
    update_sos_status,
    get_all_hazards_as_dataframe,
    insert_hazard,
    get_all_shelters_as_dataframe,
    update_shelter_live_status,
    get_dashboard_summary_metrics,
)
from backend.adapters import adapt_sos_for_triage, adapt_hazards_for_routing
from backend.algorithms.triage import rank_sos_requests
from backend.algorithms.routing import evaluate_all_corridors

# Ensure database tables exist
create_tables()
if get_all_sos_as_dataframe().empty:
    seed_mock_data()

# Preload static geo corridors
GEO_DATA_PATH = os.path.join(os.path.dirname(__file__), "backend", "data", "vellore_geo.json")
STATIC_CORRIDORS = []
if os.path.exists(GEO_DATA_PATH):
    try:
        with open(GEO_DATA_PATH, "r", encoding="utf-8") as f:
            geo_json = json.load(f)
            STATIC_CORRIDORS = geo_json.get("corridors", [])
    except Exception as e:
        print("[WARN] Could not load vellore_geo.json:", e)


class CrisisAPIHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _send_json(self, data: Any, status_code: int = 200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json({"status": "ok", "service": "SurakshaSetu Crisis API", "version": "v2.6"})

        elif path == "/api/sos":
            # Fetch from DB and rank with Backend 2 triage engine
            df_sos = get_all_sos_as_dataframe()
            adapted = adapt_sos_for_triage(df_sos)
            ranked = rank_sos_requests(adapted.to_dict(orient="records"))

            frontend_sos: List[Dict[str, Any]] = []
            for r in ranked:
                priority = "P1_CRITICAL" if "P1" in r.get("priority_tier", "") else (
                    "P2_HIGH" if "P2" in r.get("priority_tier", "") else "P3_MODERATE"
                )
                status_raw = r.get("status", "Pending")
                status = "RESCUE_BOAT_DISPATCHED" if status_raw in ["Assigned", "In Progress"] else (
                    "RESCUED" if status_raw == "Resolved" else "WAITING_DISPATCH"
                )

                frontend_sos.append({
                    "id": f"sos-{r.get('id')}",
                    "citizenName": r.get("sender_name", "Citizen"),
                    "phone": r.get("contact_number", "+91 99999 00000"),
                    "location": [float(r.get("latitude", 12.97)), float(r.get("longitude", 79.15))],
                    "landmark": r.get("location_name", "Vellore"),
                    "category": "CRITICAL_MEDICAL" if r.get("medical_need") else "BOAT_EVACUATION",
                    "trappedCount": int(r.get("people_count", 1)),
                    "hasInfants": int(r.get("vulnerable_infants", 0)) > 0,
                    "hasElderlyOrDisabled": int(r.get("vulnerable_elderly", 0)) > 0,
                    "hasPregnantWomen": int(r.get("vulnerable_pregnant", 0)) > 0,
                    "medicalEmergency": bool(r.get("medical_need")),
                    "medicalDetails": r.get("description", ""),
                    "waterLevel": "FIRST_FLOOR_ROOFTOP" if r.get("water_depth") in ["roof", "first floor"] else "WAIST_DEPTH",
                    "urgencyScore": float(r.get("triage_score", 50.0)),
                    "priorityLevel": priority,
                    "status": status,
                    "dispatchedUnit": r.get("assigned_volunteer_name"),
                    "timestamp": r.get("created_at", "Recently"),
                })
            self._send_json(frontend_sos)

        elif path == "/api/hazards":
            df_hazards = get_all_hazards_as_dataframe()
            frontend_hazards: List[Dict[str, Any]] = []
            for _, h in df_hazards.iterrows():
                frontend_hazards.append({
                    "id": f"haz-{h['id']}",
                    "type": "FLOOD_DEEP" if "flood" in str(h.get("hazard_type", "")).lower() else "LIVE_WIRE",
                    "title": h.get("hazard_type", "Hazard Alert"),
                    "hindiTitle": h.get("hazard_type", "Hazard Alert"),
                    "tamilTitle": h.get("hazard_type", "Hazard Alert"),
                    "location": [float(h["latitude"]), float(h["longitude"])],
                    "roadName": h.get("location_name", "Vellore"),
                    "waterDepthFeet": 4.0 if "flood" in str(h.get("hazard_type", "")).lower() else 1.0,
                    "status": "AUTHORITY_VERIFIED" if h.get("status") == "Active" else "RESOLVED",
                    "upvotes": 15,
                    "reportedAt": h.get("created_at", "Recently"),
                    "reportedBy": h.get("reported_by", "Citizen / Patrol"),
                })
            self._send_json(frontend_hazards)

        elif path == "/api/shelters":
            df_shelters = get_all_shelters_as_dataframe()
            frontend_shelters: List[Dict[str, Any]] = []
            for _, s in df_shelters.iterrows():
                cap_total = int(s.get("total_capacity", 500))
                cap_occ = int(s.get("current_occupancy", 100))
                status = "FULL" if cap_occ >= cap_total else ("NEAR_CAPACITY" if cap_occ >= 0.8 * cap_total else "OPEN")

                frontend_shelters.append({
                    "id": f"sh-{s['id']}",
                    "name": s["name"],
                    "hindiName": s["name"],
                    "tamilName": s["name"],
                    "location": [float(s["latitude"]), float(s["longitude"])],
                    "address": s.get("location_name", "Vellore"),
                    "capacityTotal": cap_total,
                    "capacityOccupied": cap_occ,
                    "amenities": {
                        "medicalAid": True,
                        "solarPower": True,
                        "drinkingWater": s.get("water_status") == "Sufficient",
                        "babyFood": True,
                        "wheelchairAccessible": True,
                        "communityKitchen": s.get("food_status") == "Sufficient",
                        "womenChildCare": True,
                    },
                    "phone": s.get("contact_number", "+91 0416 222000"),
                    "distanceKm": 1.2,
                    "status": status,
                    "elevationMeters": 215,
                    "contactPerson": s.get("contact_person", "Facility Officer"),
                    "lastVerifiedAt": s.get("last_updated", "Just now"),
                })
            self._send_json(frontend_shelters)

        elif path == "/api/routes":
            df_hazards = get_all_hazards_as_dataframe()
            adapted_haz = adapt_hazards_for_routing(df_hazards).to_dict(orient="records")
            evaluated = evaluate_all_corridors(STATIC_CORRIDORS, adapted_haz)
            self._send_json(evaluated)

        elif path == "/api/telemetry":
            kpi = get_dashboard_summary_metrics()
            self._send_json({
                "riverGaugeMeters": 5.8,
                "dangerMarkMeters": 7.5,
                "dischargeRateCusecs": 14500,
                "mordhanaDamDischargeCusecs": 6000,
                "status": "ORANGE",
                "advisoryText": "Palar river discharge elevated. Katpadi low causeways at flood risk.",
                "hindiAdvisoryText": "पालाड़ नदी का जलस्तर बढ़ रहा है। सतर्क रहें।",
                "tamilAdvisoryText": "பாலாற்று வெள்ளப்பெருக்கு உயர்ந்துள்ளது. எச்சரிக்கையுடன் இருக்கவும்.",
                "lastUpdated": "Live Grid Telemetry",
                "kpiMetrics": kpi,
            })
        else:
            self._send_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body_raw = self.rfile.read(length) if length > 0 else b"{}"

        try:
            payload = json.loads(body_raw.decode("utf-8"))
        except Exception:
            payload = {}

        if path == "/api/sos":
            new_id = insert_sos({
                "sender_name": payload.get("citizenName", "Citizen"),
                "contact_number": payload.get("phone", "N/A"),
                "latitude": payload.get("location", [12.97, 79.15])[0],
                "longitude": payload.get("location", [12.97, 79.15])[1],
                "location_name": payload.get("landmark", "Vellore"),
                "people_count": payload.get("trappedCount", 1),
                "medical_need": 1 if payload.get("medicalEmergency") else 0,
                "vulnerable_infants": 1 if payload.get("hasInfants") else 0,
                "vulnerable_elderly": 1 if payload.get("hasElderlyOrDisabled") else 0,
                "vulnerable_pregnant": 1 if payload.get("hasPregnantWomen") else 0,
                "water_depth": "chest",
                "description": payload.get("medicalDetails", "Emergency request"),
                "status": "Pending",
            })
            self._send_json({"success": True, "id": f"sos-{new_id}"}, 201)

        elif re.match(r"^/api/sos/([^/]+)/dispatch$", path):
            match = re.match(r"^/api/sos/([^/]+)/dispatch$", path)
            raw_id = match.group(1).replace("sos-", "")
            unit = payload.get("unitName", "NDRF Rescue Boat")
            try:
                numeric_id = int(raw_id)
                update_sos_status(numeric_id, "In Progress")
            except ValueError:
                pass
            self._send_json({"success": True, "dispatchedUnit": unit})

        elif path == "/api/hazards":
            new_id = insert_hazard({
                "hazard_type": payload.get("title", "Road Hazard"),
                "severity": "High",
                "latitude": payload.get("location", [12.97, 79.15])[0],
                "longitude": payload.get("location", [12.97, 79.15])[1],
                "location_name": payload.get("roadName", "Vellore"),
                "description": payload.get("title", ""),
                "reported_by": payload.get("reportedBy", "Citizen"),
                "status": "Active",
            })
            self._send_json({"success": True, "id": f"haz-{new_id}"}, 201)

        elif re.match(r"^/api/shelters/([^/]+)/intake$", path):
            match = re.match(r"^/api/shelters/([^/]+)/intake$", path)
            raw_id = match.group(1).replace("sh-", "")
            count = int(payload.get("count", 1))
            try:
                numeric_id = int(raw_id)
                df = get_all_shelters_as_dataframe()
                row = df[df["id"] == numeric_id]
                if not row.empty:
                    cur_occ = int(row.iloc[0]["current_occupancy"]) + count
                    tot_cap = int(row.iloc[0]["total_capacity"])
                    avail = max(0, tot_cap - cur_occ)
                    update_shelter_live_status(numeric_id, current_occupancy=cur_occ, available_beds=avail)
            except Exception as err:
                print("[ERROR] Intake update failed:", err)
            self._send_json({"success": True, "intakeCount": count})

        else:
            self._send_json({"error": "Endpoint not found"}, 404)


def run_api_server(port=8000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, CrisisAPIHandler)
    print(f"[START] SurakshaSetu REST API Server running on http://localhost:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    run_api_server()
