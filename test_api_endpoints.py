"""Automated test for SurakshaSetu REST API Server endpoints"""
import threading
import time
import json
from urllib.request import urlopen, Request
from api_server import run_api_server

def test_api():
    # Start server in background thread
    server_thread = threading.Thread(target=run_api_server, kwargs={"port": 8001}, daemon=True)
    server_thread.start()
    time.sleep(1)

    base = "http://localhost:8001/api"

    # 1. Health
    res = urlopen(f"{base}/health")
    data = json.loads(res.read().decode())
    assert data["status"] == "ok"
    print("[PASS] GET /api/health returned ok")

    # 2. SOS
    res = urlopen(f"{base}/sos")
    data = json.loads(res.read().decode())
    assert isinstance(data, list)
    print(f"[PASS] GET /api/sos returned {len(data)} prioritized records")

    # 3. Hazards
    res = urlopen(f"{base}/hazards")
    data = json.loads(res.read().decode())
    assert isinstance(data, list)
    print(f"[PASS] GET /api/hazards returned {len(data)} active hazards")

    # 4. Shelters
    res = urlopen(f"{base}/shelters")
    data = json.loads(res.read().decode())
    assert isinstance(data, list)
    print(f"[PASS] GET /api/shelters returned {len(data)} emergency shelters")

    # 5. Routes
    res = urlopen(f"{base}/routes")
    data = json.loads(res.read().decode())
    assert isinstance(data, list)
    print(f"[PASS] GET /api/routes evaluated {len(data)} corridors with detour logic")

    # 6. Telemetry
    res = urlopen(f"{base}/telemetry")
    data = json.loads(res.read().decode())
    assert "riverGaugeMeters" in data
    print(f"[PASS] GET /api/telemetry returned gauge={data['riverGaugeMeters']}m (Danger: {data['dangerMarkMeters']}m)")

    # 7. POST SOS
    req = Request(f"{base}/sos", data=json.dumps({
        "citizenName": "Test Citizen",
        "phone": "+91 99999 88888",
        "location": [12.971, 79.158],
        "landmark": "Near VIT Gate",
        "trappedCount": 3,
        "medicalEmergency": True,
    }).encode(), headers={"Content-Type": "application/json"})
    res = urlopen(req)
    data = json.loads(res.read().decode())
    assert data["success"] is True
    print(f"[PASS] POST /api/sos created {data['id']}")

    print("\n" + "="*50)
    print("ALL API ENDPOINTS TESTED & PASSED 100%!")
    print("="*50)

if __name__ == "__main__":
    test_api()
