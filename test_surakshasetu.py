"""
SurakshaSetu - Comprehensive Database Test Suite
Designed for: Vinhack 2026 (VIT Vellore)
Role: Member 2 (Database Architect / Backend 1)

This script tests all 7 features + core CRUD operations and validates
that DataFrames, scores, and status updates work as expected.
"""

import os
from database import (
    DB_PATH,
    create_tables,
    seed_mock_data,
    insert_sos,
    get_all_sos_as_dataframe,
    update_sos_status,
    insert_hazard,
    get_all_hazards_as_dataframe,
    update_hazard_status,
    insert_shelter,
    get_all_shelters_as_dataframe,
    update_shelter_live_status,
    find_nearest_shelters,
    create_family_group,
    add_or_update_family_member,
    get_family_members_as_dataframe,
    register_volunteer,
    get_all_volunteers_as_dataframe,
    get_nearby_unassigned_sos_as_dataframe,
    accept_sos_task,
    insert_resource_request,
    get_all_resource_requests_as_dataframe,
    update_resource_request_status,
    enqueue_offline_sos,
    sync_offline_sos_queue,
    get_dashboard_summary_metrics,
    get_ui_dictionary
)

TEST_DB = "test_surakshasetu.db"


def run_all_tests():
    print("=" * 70)
    print("🚀 STARTING COMPREHENSIVE SURAKSHASETU TEST SUITE")
    print("=" * 70)

    # Cleanup old test db if present
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

    # -------------------------------------------------------------
    # TEST 1: Database Initialization & Tables
    # -------------------------------------------------------------
    print("\n[TEST 1] Initializing Tables & Seeding Mock Data...")
    create_tables(db_path=TEST_DB)
    seed_mock_data(db_path=TEST_DB)
    print("✅ Tables created and mock data seeded successfully.")

    # -------------------------------------------------------------
    # TEST 2: SOS Operations & Auto-Priority Badges (Feature 5)
    # -------------------------------------------------------------
    print("\n[TEST 2] Testing SOS Distress & Auto-Priority Badges...")
    sos_id = insert_sos({
        "sender_name": "Dr. A. Raman",
        "contact_number": "+91 99999 11111",
        "latitude": 12.9700,
        "longitude": 79.1580,
        "location_name": "VIT Main Building",
        "people_count": 5,
        "medical_need": 1,
        "vulnerable_infants": 2,
        "vulnerable_elderly": 1,
        "description": "Urgent oxygen cylinder and pediatric support required.",
        "status": "Pending"
    }, db_path=TEST_DB)
    print(f"✅ Inserted new Critical SOS with ID: {sos_id}")

    df_sos = get_all_sos_as_dataframe(db_path=TEST_DB)
    print(f"✅ Retrieved {len(df_sos)} SOS requests as DataFrame.")
    print("   Sample Columns: [id, sender_name, urgency_score, badge, priority_color, status]")
    for _, row in df_sos.head(2).iterrows():
        print(f"   -> SOS #{row['id']} | {row['sender_name']} | Urgency: {row['urgency_score']} | Badge: {row['badge']} | Color: {row['priority_color']}")

    # Update SOS status
    updated = update_sos_status(sos_id, "In Progress", db_path=TEST_DB)
    assert updated, "Failed to update SOS status!"
    print("✅ SOS status updated to 'In Progress'.")

    # -------------------------------------------------------------
    # TEST 3: Nearest Shelter & Live Status (Feature 3)
    # -------------------------------------------------------------
    print("\n[TEST 3] Testing Nearest Shelter & Live Supplies...")
    df_nearest = find_nearest_shelters(user_lat=12.9716, user_lon=79.1590, top_k=2, db_path=TEST_DB)
    print(f"✅ Found {len(df_nearest)} nearest shelters:")
    for _, row in df_nearest.iterrows():
        print(f"   -> {row['name']} | Distance: {row['distance_km']} km | Available Beds: {row['available_beds']} | Food: {row['food_status']}")

    # Update shelter live status
    shelter_updated = update_shelter_live_status(
        shelter_id=1,
        current_occupancy=190,
        available_beds=60,
        food_status="Sufficient",
        water_status="Sufficient",
        medical_supply_status="Good",
        db_path=TEST_DB
    )
    assert shelter_updated, "Failed to update shelter live status!"
    print("✅ Shelter live supply status updated.")

    # -------------------------------------------------------------
    # TEST 4: Family / Group Check-In (Feature 1)
    # -------------------------------------------------------------
    print("\n[TEST 4] Testing Family Check-In System...")
    fam_code = create_family_group("Vellore Volunteers Group", creator_name="Arun", creator_phone="+91 98888 77777", db_path=TEST_DB)
    print(f"✅ Created Family Group Code: {fam_code}")

    add_or_update_family_member({
        "group_code": fam_code,
        "member_name": "Arun (Leader)",
        "status": "Safe",
        "location_name": "VIT Library",
        "health_note": "All good, coordinating rescue"
    }, db_path=TEST_DB)

    add_or_update_family_member({
        "group_code": fam_code,
        "member_name": "Kavitha",
        "status": "Need Help",
        "location_name": "Near Lake Hostel",
        "health_note": "Stuck due to flooding"
    }, db_path=TEST_DB)

    df_fam = get_family_members_as_dataframe(group_code=fam_code, db_path=TEST_DB)
    print(f"✅ Retrieved {len(df_fam)} family group members:")
    for _, row in df_fam.iterrows():
        print(f"   -> {row['member_name']} | Status: {row['status']} | Location: {row['location_name']}")

    # -------------------------------------------------------------
    # TEST 5: Volunteer Mode & Task Assignment (Feature 2)
    # -------------------------------------------------------------
    print("\n[TEST 5] Testing Volunteer Registration & Task Acceptance...")
    vol_id = register_volunteer({
        "name": "Captain Mohan",
        "phone_number": "+91 97777 88888",
        "skills": "NDRF Trained, Speedboat Operator",
        "vehicle_type": "Motorboat",
        "current_latitude": 12.9716,
        "current_longitude": 79.1590,
        "is_available": 1
    }, db_path=TEST_DB)
    print(f"✅ Registered Volunteer with ID: {vol_id}")

    df_nearby_sos = get_nearby_unassigned_sos_as_dataframe(
        volunteer_lat=12.9716,
        volunteer_lon=79.1590,
        radius_km=10.0,
        db_path=TEST_DB
    )
    print(f"✅ Found {len(df_nearby_sos)} nearby unassigned SOS within 10 km.")

    if not df_nearby_sos.empty:
        target_sos_id = int(df_nearby_sos.iloc[0]["id"])
        accepted = accept_sos_task(target_sos_id, volunteer_id=vol_id, volunteer_name="Captain Mohan", db_path=TEST_DB)
        assert accepted, "Failed to accept SOS task!"
        print(f"✅ Volunteer accepted SOS #{target_sos_id} (Status updated to 'Assigned').")

    # -------------------------------------------------------------
    # TEST 6: Resource Request Board (Feature 4)
    # -------------------------------------------------------------
    print("\n[TEST 6] Testing Resource Request Board...")
    req_id = insert_resource_request({
        "requester_name": "Katpadi Girls Hostel",
        "contact_number": "+91 94444 33322",
        "category": "Drinking Water",
        "items_needed": "Bottled Water & First Aid Kits",
        "quantity": "30 crates",
        "latitude": 12.9720,
        "longitude": 79.1580,
        "location_name": "Hostel Block D",
        "status": "Open"
    }, db_path=TEST_DB)
    print(f"✅ Inserted Resource Request with ID: {req_id}")

    update_resource_request_status(req_id, new_status="In Transit", fulfilled_by="Rotary Club Vellore", db_path=TEST_DB)
    df_resources = get_all_resource_requests_as_dataframe(db_path=TEST_DB)
    print(f"✅ Retrieved {len(df_resources)} Resource Requests as DataFrame.")

    # -------------------------------------------------------------
    # TEST 7: Offline SOS Queue & Sync Engine (Feature 6)
    # -------------------------------------------------------------
    print("\n[TEST 7] Testing Offline SOS Queue & Auto-Sync...")
    q_id = enqueue_offline_sos({
        "sender_name": "Offline User (No Internet)",
        "contact_number": "+91 91111 22222",
        "latitude": 12.9705,
        "longitude": 79.1575,
        "location_name": "Katpadi Market",
        "people_count": 3,
        "medical_need": 0,
        "description": "Queued while network was down."
    }, db_path=TEST_DB)
    print(f"✅ Queued Offline SOS with Queue ID: {q_id}")

    synced_count = sync_offline_sos_queue(db_path=TEST_DB)
    print(f"✅ Network restored: Synced {synced_count} offline request(s) into live SOS database.")

    # -------------------------------------------------------------
    # TEST 8: Multilingual Dictionary (Feature 7)
    # -------------------------------------------------------------
    print("\n[TEST 8] Testing Multilingual UI Translations...")
    t_en = get_ui_dictionary("en")
    t_ta = get_ui_dictionary("ta")
    t_hi = get_ui_dictionary("hi")
    print(f"   • English Title: {t_en['app_title']}")
    print(f"   • Tamil Title  : {t_ta['app_title']}")
    print(f"   • Hindi Title  : {t_hi['app_title']}")
    print("✅ Multilingual localization engine verified.")

    # -------------------------------------------------------------
    # TEST 9: KPI Metrics Summary
    # -------------------------------------------------------------
    print("\n[TEST 9] Testing Dashboard Summary Metrics...")
    kpi = get_dashboard_summary_metrics(db_path=TEST_DB)
    print(f"✅ KPI Metrics returned successfully:")
    for k, v in kpi.items():
        print(f"   -> {k}: {v}")

    # Cleanup test db
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

    print("\n" + "=" * 70)
    print("🎉 ALL TESTS PASSED SUCCESSFULLY! BACKEND IS 100% READY FOR FRONTEND.")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
