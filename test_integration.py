"""End-to-end integration test: database.py -> adapters.py -> map_builder.py"""
import os
from database import create_tables, seed_mock_data, get_all_sos_as_dataframe, get_all_hazards_as_dataframe
from backend.adapters import adapt_sos_for_triage, adapt_hazards_for_routing
from backend.visualization.map_builder import build_emergency_map

TEST_DB = "integration_test.db"

# Setup
create_tables(db_path=TEST_DB)
seed_mock_data(db_path=TEST_DB)

# Fetch from DB
raw_sos = get_all_sos_as_dataframe(db_path=TEST_DB)
raw_hazards = get_all_hazards_as_dataframe(db_path=TEST_DB)
print("[OK] DB returned %d SOS rows, %d hazard rows" % (len(raw_sos), len(raw_hazards)))

# Check columns
sos_cols = list(raw_sos.columns)
haz_cols = list(raw_hazards.columns)
print("[OK] SOS columns: %s" % sos_cols)
print("[OK] Hazard columns: %s" % haz_cols)

assert "water_depth" in sos_cols, "FAIL: water_depth missing from SOS"
assert "severity_radius_meters" in haz_cols, "FAIL: severity_radius_meters missing from hazards"
assert "is_active" in haz_cols, "FAIL: is_active missing from hazards"

# Adapt schemas
adapted_sos = adapt_sos_for_triage(raw_sos)
adapted_hazards = adapt_hazards_for_routing(raw_hazards)

assert "medical_urgency" in adapted_sos.columns, "FAIL: medical_urgency not created"
assert "vulnerable_count" in adapted_sos.columns, "FAIL: vulnerable_count not created"
print("[OK] Adapter mapped: medical_urgency, vulnerable_count, water_depth")
print("[OK] Adapter mapped: severity_radius_meters, is_active")

# Build map end-to-end
emergency_map = build_emergency_map(
    sos_data=adapted_sos.to_dict(orient="records"),
    hazards_data=adapted_hazards.to_dict(orient="records")
)
print("[OK] Map object created: %s" % type(emergency_map).__name__)

# Save map to verify
emergency_map.save("integration_test_map.html")
map_size = os.path.getsize("integration_test_map.html")
print("[OK] Map saved: integration_test_map.html (%s KB)" % round(map_size / 1024, 1))

# Cleanup
os.remove(TEST_DB)
os.remove("integration_test_map.html")

print()
print("=" * 60)
print("INTEGRATION TEST PASSED - READY FOR FRONTEND")
print("=" * 60)
