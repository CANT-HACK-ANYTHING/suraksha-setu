"""Export live SQLite database data to vellore_emergency_map.html"""
import os
from database import (
    create_tables,
    seed_mock_data,
    get_all_sos_as_dataframe,
    get_all_hazards_as_dataframe
)
from backend.adapters import adapt_sos_for_triage, adapt_hazards_for_routing
from backend.visualization.map_builder import build_emergency_map

def export_db_map():
    create_tables()
    df_sos = get_all_sos_as_dataframe()
    if df_sos.empty:
        seed_mock_data()
        df_sos = get_all_sos_as_dataframe()

    df_hazards = get_all_hazards_as_dataframe()

    print("[INFO] Pulling from SQLite DB:")
    print("       - SOS Records: %d" % len(df_sos))
    for _, row in df_sos.iterrows():
        print("         * #%s %s (%s) - Urgency: %s" % (
            row["id"], row["sender_name"], row.get("location_name", "Vellore"), row["urgency_score"]
        ))
    
    print("       - Hazard Records: %d" % len(df_hazards))
    for _, row in df_hazards.iterrows():
        print("         * #%s %s (%s) - Radius: %sm" % (
            row["id"], row["hazard_type"], row.get("location_name", "Vellore"), row.get("severity_radius_meters", 150)
        ))

    # Adapt data for Backend 2 map engine
    sos_payload = adapt_sos_for_triage(df_sos).to_dict(orient="records")
    haz_payload = adapt_hazards_for_routing(df_hazards).to_dict(orient="records")

    # Build map
    emergency_map = build_emergency_map(sos_data=sos_payload, hazards_data=haz_payload)
    output_path = os.path.join(os.path.dirname(__file__), "backend", "vellore_emergency_map.html")
    emergency_map.save(output_path)
    file_size = round(os.path.getsize(output_path) / 1024, 1)
    print("\n[SUCCESS] Refreshed map saved to %s (%s KB)" % (output_path, file_size))

if __name__ == "__main__":
    export_db_map()
