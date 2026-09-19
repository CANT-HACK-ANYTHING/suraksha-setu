# SurakshaSetu - Backend 2: Algorithms & Spatial Routing

This directory contains the complete intelligence and geospatial routing engine for **SurakshaSetu**, developed for **Backend 2**.

---

## 📁 Architecture Overview

```
C:\SurakshaSetu/
├── requirements.txt               # Dependencies (folium, pandas, streamlit-folium)
├── mock_data.py                   # Realistic Vellore test data matching DB schemas
├── test_backend2.py               # Complete test & verification script
├── README.md                      # Integration documentation for teammates
├── data/
│   └── vellore_geo.json           # GPS coordinates for Vellore hospitals, shelters & corridors
├── algorithms/
│   ├── __init__.py
│   ├── triage.py                  # Triage scoring & priority tiering engine (0-100 pts)
│   └── routing.py                 # Pure-math Haversine, point-to-segment & route obstruction
└── visualization/
    ├── __init__.py
    └── map_builder.py             # Master Folium map generator for Streamlit integration
```

---

## 🤝 Teammate Integration Guide

### 1. How Member 1 (Frontend Lead) Uses Your Code in Streamlit
Member 1 only needs to import one function:

```python
import streamlit as st
from streamlit_folium import st_folium
from visualization.map_builder import build_emergency_map
# from database import get_all_sos_as_dataframe, get_all_hazards_as_dataframe (from Member 2)

st.title("SurakshaSetu: Emergency Operations Center")

# Fetch data from Member 2's database functions
sos_df = get_all_sos_as_dataframe()
hazards_df = get_all_hazards_as_dataframe()

# Generate the ready-to-render Folium map
emergency_map = build_emergency_map(sos_df, hazards_df)

# Render inside Streamlit
st_folium(emergency_map, width="100%", height=650)
```

---

### 2. How Member 2 (Database Architect) Feeds Data
Your engine supports both **Pandas DataFrames** and **lists of standard Python dicts**:

#### SOS Schema:
* `id`: Request ID (int or str)
* `latitude`, `longitude`: Floats
* `medical_urgency`: "Critical" / "Moderate" / "None" (or specific conditions like "Cardiac", "Fracture", "Labor")
* `vulnerable_count`: Number of infants, seniors, or pregnant persons (int)
* `water_depth`: "Roof Top", "First Floor", or "Ground Floor"
* `people_count`: Total headcount (int)
* `status`: "Pending", "In-Progress", "Rescued"

#### Hazard Schema:
* `id`: Hazard ID
* `latitude`, `longitude`: Floats
* `hazard_type`: e.g. "Severe Flash Flood", "Bridge Collapse", "Downed Powerline"
* `severity_radius_meters`: Danger buffer in meters (e.g. 150m, 200m)
* `is_active`: boolean (`True` / `False`)

---

## 🧠 Core Algorithms

### 1. Triage Scoring Formula (`algorithms/triage.py`)
Calculates a normalized urgency score between **0.0 and 100.0**:
$$\text{Score} = \text{Medical Pts} (0\text{–}40) + \text{Vulnerability Pts} (0\text{–}30) + \text{Water Level Pts} (0\text{–}20) + \text{Headcount Pts} (0\text{–}10)$$

* **P1 - Critical (Score $\ge 75$):** Red Marker, Ambulance icon. Immediate dispatch.
* **P2 - Urgent (Score $45\text{–}74$):** Orange Marker, Warning icon. High priority.
* **P3 - Standard (Score $< 45$):** Blue Marker, Info icon. Standard queue.

### 2. Route Obstruction & Rerouting (`algorithms/routing.py`)
* Computes exact perpendicular clearance from any hazard to route segments using vectorized projection and Haversine spherical distance.
* If a hazard is within its threat radius of a route:
  * **Primary Route Safe:** Displays vibrant Green line.
  * **Primary Blocked $\rightarrow$ Alternate Clear:** Switches automatically to Alternate Route (Royal Blue line) and renders the blocked route in dashed Red.
  * **Both Blocked:** Triggers critical alarm state (Dashed Red line).

---

## 🚀 Running Verification Tests Locally
Run the test script to verify all algorithms and generate an interactive preview map:

```powershell
cd C:\SurakshaSetu
python test_backend2.py
```
This generates `vellore_emergency_map.html`, which you can double-click to view directly in Chrome/Edge/Firefox.
