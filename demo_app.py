"""
SurakshaSetu - Quick Visual Verification App
Run this to see your database connected directly with Streamlit!

Usage:
    streamlit run demo_app.py
"""

import streamlit as st
from database import (
    create_tables,
    seed_mock_data,
    get_all_sos_as_dataframe,
    get_all_hazards_as_dataframe,
    get_all_shelters_as_dataframe,
    get_dashboard_summary_metrics,
    get_ui_dictionary
)

st.set_page_config(page_title="SurakshaSetu Backend Demo", layout="wide", page_icon="🛡️")

# Initialize database
create_tables()

# Sidebar
st.sidebar.title("🛡️ SurakshaSetu Control")
lang_choice = st.sidebar.selectbox("Language / மொழி / भाषा", ["English", "Tamil", "Hindi"])
lang_map = {"English": "en", "Tamil": "ta", "Hindi": "hi"}
t = get_ui_dictionary(lang_map[lang_choice])

if st.sidebar.button("🔄 Reset / Seed Mock Data"):
    seed_mock_data()
    st.sidebar.success("Vellore Disaster Mock Data Seeded!")

st.title(t["app_title"])
st.caption("Backend & Database Layer Verification (Vinhack 2026)")

# Metrics Bar
metrics = get_dashboard_summary_metrics()
c1, c2, c3, c4 = st.columns(4)
c1.metric("🚨 Active SOS", metrics["active_sos_count"])
c2.metric("👥 People Stranded", metrics["total_people_stranded"])
c3.metric("🏥 Critical Medical", metrics["critical_medical_cases"])
c4.metric("🏠 Open Shelters", f"{metrics['open_shelters']} ({metrics['shelter_occupancy_pct']}% Full)")

st.divider()

# Tabs
tab1, tab2, tab3, tab4 = st.tabs(["🚨 SOS Emergency Table", "⚠️ Active Hazards", "🏠 Emergency Shelters", "🗺️ Live Tactical Map"])

with tab1:
    st.subheader("Live SOS Distress Stream (Sorted by Auto Urgency)")
    df_sos = get_all_sos_as_dataframe()
    if not df_sos.empty:
        st.dataframe(
            df_sos[["id", "sender_name", "urgency_score", "badge", "priority_color", "people_count", "medical_need", "status", "location_name"]],
            use_container_width=True
        )
    else:
        st.info("No SOS requests found. Click 'Seed Mock Data' in sidebar.")

with tab2:
    st.subheader("Hazard & Blocked Road Alerts")
    df_hazards = get_all_hazards_as_dataframe()
    st.dataframe(df_hazards, use_container_width=True)

with tab3:
    st.subheader("Relief Shelters & Live Supplies")
    df_shelters = get_all_shelters_as_dataframe()
    st.dataframe(df_shelters, use_container_width=True)

with tab4:
    st.subheader("Vellore Flood Evacuation Corridors & Real-Time Triage Map")
    try:
        from streamlit_folium import st_folium
        from backend.adapters import adapt_sos_for_triage, adapt_hazards_for_routing
        from backend.visualization.map_builder import build_emergency_map

        df_sos_curr = get_all_sos_as_dataframe()
        df_haz_curr = get_all_hazards_as_dataframe()

        adapted_sos = adapt_sos_for_triage(df_sos_curr) if not df_sos_curr.empty else []
        adapted_haz = adapt_hazards_for_routing(df_haz_curr) if not df_haz_curr.empty else []

        sos_payload = adapted_sos.to_dict(orient="records") if hasattr(adapted_sos, "to_dict") else []
        haz_payload = adapted_haz.to_dict(orient="records") if hasattr(adapted_haz, "to_dict") else []

        emergency_map = build_emergency_map(sos_data=sos_payload, hazards_data=haz_payload)
        st_folium(emergency_map, width=1050, height=620, returned_objects=[])
    except Exception as err:
        st.error(f"Unable to render map: {err}")
