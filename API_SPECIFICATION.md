# 🌐 SurakshaSetu: Complete Backend API Specification (v1.0)
### Multi-Hazard Crisis Intelligence and Evacuation Platform
**Built for VinHack 2026 — VIT Vellore**

---

## 🧭 General Architecture & Conventions
* **Base URL**: `http://localhost:5000/api/v1` (or `http://localhost:8000/api/v1`)
* **Data Format**: `application/json` (UTF-8)
* **Standard Response Wrapper**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Action completed successfully",
  "timestamp": "2026-09-19T09:40:00.000Z"
}
```
* **Standard Error Wrapper**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "SOS request with ID sos-99 not found"
  },
  "timestamp": "2026-09-19T09:40:00.000Z"
}
```

---

## 📡 MODULE 1: THREAT BROADCAST & TELEMETRY
Controls the full-page video hero (`d.mp4`, `nd.mp4`, `s.mp4`) and real-time river gauges.

### 1.1 `GET /api/v1/broadcast/current`
Fetches the active threat level and broadcast metadata displayed on citizen phones.
* **Method**: `GET`
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "stage": "DANGER",
    "videoFile": "/D.mp4",
    "videoCode": "d.mp4",
    "threatLevel": "RED",
    "headline": "DANGER",
    "subTitle": "LEVEL 3: IMMEDIATE EVACUATION ORDER",
    "statusMessage": "Palar River surge has breached Katpadi low-lying causeway. Water level rising fast.",
    "quote": "“Disasters do not wait for tomorrow. Every minute on low ground is a minute lost. Move to high ground now.”",
    "inundation": "4.8 ft (RISING FAST)",
    "elevation": "214m (Low Ground)",
    "targetSector": "Katpadi Ward 12 • Palar Basin",
    "autoLoop": false,
    "lastBroadcastAt": "2026-09-19T09:35:00.000Z",
    "broadcastBy": "DEOC Vellore Incident Commander"
  }
}
```

---

### 1.2 `POST /api/v1/broadcast/override`
Executed exclusively from the **NDRF Command Center (Controller Window)** to alter threat broadcast across all connected citizen phones.
* **Method**: `POST`
* **Request Body**:
```json
{
  "stage": "NEAR_DANGER",
  "autoLoop": false,
  "officerId": "DEOC-OFFICER-1077",
  "overrideReason": "Water stabilizing within 400m perimeter"
}
```
* **Validation**:
  * `stage`: Must be one of `["DANGER", "NEAR_DANGER", "SAFE"]`.
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "stage": "NEAR_DANGER",
    "videoFile": "/ND.mp4",
    "videoCode": "nd.mp4",
    "headline": "DANGER NEARBY",
    "activeSince": "2026-09-19T09:41:15.000Z"
  },
  "message": "Broadcast override published to all citizen clients"
}
```

---

### 1.3 `GET /api/v1/telemetry/palar`
Returns real-time hydrological gauge metrics and multi-hazard risk formula weights.
* **Method**: `GET`
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "riverGaugeMeters": 8.4,
    "dangerMarkMeters": 7.5,
    "isBreached": true,
    "dischargeRateCusecs": 31500,
    "mordhanaDamDischargeCusecs": 14200,
    "status": "RED",
    "advisoryText": "Palar River discharge breached danger mark at Kangeyanallur causeway. Evacuate low-lying areas.",
    "lastUpdated": "Live CWC/IMD Telemetry",
    "riskBreakdown": {
      "rainfallForecastP": 90,
      "riverWaterLevelW": 88,
      "inundationDepthD": 85,
      "vulnerabilityV": 80,
      "evacuationDifficultyE": 75,
      "compositeScore": 86,
      "threatStatus": "RED"
    }
  }
}
```

---

## 🚨 MODULE 2: BATTLEFIELD TRIAGE SOS ENGINE
The most critical life-safety module. Processes incoming distress calls and prioritizes boats.

### 2.1 `POST /api/v1/sos`
Triggered when a stranded citizen holds the **Radial SOS button for 1.5 seconds**.
* **Method**: `POST`
* **Request Body**:
```json
{
  "citizenName": "Kalyani Ramanathan",
  "phone": "+91 98412 87612",
  "location": [12.9320, 79.1120],
  "landmark": "Shenbakkam, 2nd Cross Street, near Mariamman Temple",
  "category": "CRITICAL_MEDICAL",
  "trappedCount": 4,
  "hasInfants": true,
  "hasElderlyOrDisabled": true,
  "hasPregnantWomen": false,
  "medicalEmergency": true,
  "medicalDetails": "82-year-old grandfather on oxygen concentrator, battery dying",
  "waterLevel": "FIRST_FLOOR_ROOFTOP"
}
```
* **Backend Processing Requirement**:
  * Backend **MUST calculate `urgencyScore` (0–100) and `priorityLevel` (P1/P2/P3)** using the deterministic triage formula:
    * Base: `15`
    * `hasInfants`: `+25`
    * `hasPregnantWomen`: `+25`
    * `hasElderlyOrDisabled`: `+20`
    * `trappedCount > 1`: `+(trappedCount - 1) * 3` (capped at `+15`)
    * `medicalEmergency`: `+35`
    * `waterLevel == 'FIRST_FLOOR_ROOFTOP'`: `+30` (or `WAIST_DEPTH`: `+18`, `ANKLE_DEPTH`: `+6`)
    * Score $\ge 75 \rightarrow$ `P1_CRITICAL`, $\ge 45 \rightarrow$ `P2_HIGH`, else `P3_MODERATE`.
* **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "sos-1082",
    "citizenName": "Kalyani Ramanathan",
    "phone": "+91 98412 87612",
    "location": [12.9320, 79.1120],
    "landmark": "Shenbakkam, 2nd Cross Street, near Mariamman Temple",
    "urgencyScore": 96,
    "priorityLevel": "P1_CRITICAL",
    "status": "WAITING_DISPATCH",
    "createdAt": "2026-09-19T09:42:00.000Z"
  },
  "message": "Distress call prioritized and added to NDRF dispatch queue"
}
```

---

### 2.2 `GET /api/v1/sos`
Used by the **NDRF Command Center** to render the prioritized dispatch queue.
* **Method**: `GET`
* **Query Parameters**:
  * `status`: `WAITING_DISPATCH` | `RESCUE_BOAT_DISPATCHED` | `RESCUED` | `ALL` (default: `ALL`)
  * `priority`: `P1_CRITICAL` | `P2_HIGH` | `P3_MODERATE`
* **Sorting Rule**: Backend **must sort** unrescued calls first, ordered by `urgencyScore` descending (`sort: urgencyScore: -1`).
* **Response `200 OK`**:
```json
{
  "success": true,
  "count": 3,
  "summary": {
    "p1CriticalCount": 2,
    "waitingDispatchCount": 2,
    "enRouteCount": 1,
    "rescuedCount": 0
  },
  "data": [
    {
      "id": "sos-1082",
      "citizenName": "Kalyani Ramanathan",
      "phone": "+91 98412 87612",
      "location": [12.9320, 79.1120],
      "landmark": "Shenbakkam, 2nd Cross Street",
      "category": "CRITICAL_MEDICAL",
      "trappedCount": 4,
      "hasInfants": true,
      "hasElderlyOrDisabled": true,
      "hasPregnantWomen": false,
      "medicalEmergency": true,
      "medicalDetails": "Oxygen concentrator battery dying",
      "waterLevel": "FIRST_FLOOR_ROOFTOP",
      "urgencyScore": 96,
      "priorityLevel": "P1_CRITICAL",
      "status": "WAITING_DISPATCH",
      "timestamp": "Just now"
    }
  ]
}
```

---

### 2.3 `PATCH /api/v1/sos/:id/dispatch`
Invoked when the Commander clicks **`DISPATCH NDRF RESCUE BOAT`**.
* **Method**: `PATCH`
* **Request Body**:
```json
{
  "unitName": "NDRF Zodiac Unit #5 (Arakkonam Base)",
  "officerBadge": "NDRF-TN-4BN"
}
```
* **Backend Processing**:
  * Updates `status` to `"RESCUE_BOAT_DISPATCHED"`.
  * Sets `dispatchedUnit = unitName`.
  * Increments system-wide deployed boats metric.
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "sos-1082",
    "status": "RESCUE_BOAT_DISPATCHED",
    "dispatchedUnit": "NDRF Zodiac Unit #5 (Arakkonam Base)",
    "dispatchedAt": "2026-09-19T09:43:10.000Z"
  },
  "message": "Boat unit assigned and en route to victim coordinates"
}
```

---

### 2.4 `PATCH /api/v1/sos/:id/rescue`
Invoked when the Commander clicks **`CONFIRM RESCUED`**.
* **Method**: `PATCH`
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "sos-1082",
    "status": "RESCUED",
    "rescuedAt": "2026-09-19T09:45:00.000Z"
  },
  "message": "Victim verified rescued and transported to safe relief camp"
}
```

---

### 2.5 `POST /api/v1/sos/sms-fallback`
Webhook endpoint for offline SMS gateway (e.g. Twilio / GSM modem linked to `1077`).
* **Method**: `POST`
* **Request Body**:
```json
{
  "from": "+919841287612",
  "body": "EMERGENCY SOS: LAT:12.9320 LON:79.1120 TRAPPED:4 WATER:FIRST_FLOOR MEDICAL:YES",
  "receivedAt": "2026-09-19T09:42:15.000Z"
}
```
* **Backend Processing**:
  * Parses regex coordinates and severity flags.
  * Injects parsed SOS into the live database queue with high triage score.
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "sosId": "sos-sms-991",
    "parsed": true
  }
}
```

---

## 🏕️ MODULE 3: RELIEF SHELTERS & LOGISTICS
Manages safe high-ground relief centers, free bed availability, and camp amenities.

### 3.1 `GET /api/v1/shelters`
* **Method**: `GET`
* **Response `200 OK`**:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "shelter-1",
      "name": "VIT Indoor Sports Complex (Primary Relief Camp)",
      "hindiName": "वीआईटी इंडोर स्पोर्ट्स कॉम्प्लेक्स (मुख्य राहत शिविर)",
      "tamilName": "விஐடி உள்விளையாட்டு அரங்கம் (முதன்மை நிவாரண முகாம்)",
      "location": [12.9715, 79.1610],
      "address": "VIT University Campus, Katpadi-Thiruvalam Road, Vellore",
      "capacityTotal": 300,
      "capacityOccupied": 184,
      "freeBeds": 116,
      "elevationMeters": 218,
      "distanceKm": 1.2,
      "status": "OPEN",
      "phone": "0416-2202100",
      "contactPerson": "Dr. S. Kumar (Camp Director)",
      "amenities": {
        "medicalAid": true,
        "solarPower": true,
        "drinkingWater": true,
        "babyFood": true,
        "wheelchairAccessible": true,
        "communityKitchen": true,
        "womenChildCare": true
      }
    }
  ]
}
```

---

### 3.2 `PATCH /api/v1/shelters/:id/occupancy`
Allows camp officers to update headcount as refugees arrive.
* **Method**: `PATCH`
* **Request Body**:
```json
{
  "capacityOccupied": 204
}
```
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "shelter-1",
    "capacityOccupied": 204,
    "freeBeds": 96,
    "status": "OPEN"
  }
}
```

---

## 🚧 MODULE 4: CROWDSOURCED HAZARD VERIFICATION
Tracks road collapses, submerged causeways, and live electrical wires.

### 4.1 `GET /api/v1/hazards`
* **Method**: `GET`
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "haz-1",
      "type": "FLOOD_DEEP",
      "title": "Kangeyanallur Causeway Submerged (4.8 ft)",
      "location": [12.9460, 79.1350],
      "roadName": "Kangeyanallur - Vellore Old Bridge Road",
      "waterDepthFeet": 4.8,
      "status": "AUTHORITY_VERIFIED",
      "upvotes": 38,
      "reportedBy": "Vellore Traffic Police & DEOC (1077)",
      "reportedAt": "12 mins ago"
    }
  ]
}
```

---

### 4.2 `POST /api/v1/hazards`
Citizen report submission.
* **Method**: `POST`
* **Request Body**:
```json
{
  "type": "LIVE_WIRE",
  "title": "Electric Wire Broken in Water",
  "location": [12.9340, 79.1150],
  "roadName": "Shenbakkam River Bank Road",
  "waterDepthFeet": 2.5,
  "reportedBy": "Ramesh K."
}
```
* **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "haz-501",
    "status": "UNVERIFIED",
    "upvotes": 1
  }
}
```

---

### 4.3 `PATCH /api/v1/hazards/:id/verify`
Commander verifies hazard from DEOC dashboard.
* **Method**: `PATCH`
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "haz-501",
    "status": "AUTHORITY_VERIFIED",
    "verifiedAt": "2026-09-19T09:44:00.000Z"
  },
  "message": "Hazard marked verified and pushed to avoidance routing engine"
}
```

---

## 👨‍👩‍👧 MODULE 5: FAMILY REUNION & SAFE CHECK-INS

### 5.1 `POST /api/v1/reunion/check-in`
Allows evacuated citizens to mark themselves safe so relatives stop panicking.
* **Request Body**:
```json
{
  "name": "Murugan Velu",
  "familySize": 3,
  "currentShelterOrLocation": "VIT Indoor Sports Complex (Camp 1)",
  "phone": "+91 94441 55210",
  "status": "SAFE_AT_SHELTER"
}
```

---

### 5.2 `GET /api/v1/reunion/missing`
Searchable directory of missing persons.
* **Query Parameters**: `?search=Sundar&gender=MALE`

---

## 🗺️ MODULE 6: HAZARD-AVOIDANCE SAFE ROUTING

### 6.1 `POST /api/v1/routing/safe-path`
Calculates an elevated safe bypass corridor, dynamically avoiding all `AUTHORITY_VERIFIED` flooded choke points.
* **Request Body**:
```json
{
  "origin": [12.9719, 79.1588],
  "destination": [12.9715, 79.1610],
  "mode": "WALKING_HIGH_GROUND"
}
```
* **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "safeRoute": {
      "coordinates": [
        [12.9719, 79.1588],
        [12.9690, 79.1520],
        [12.9715, 79.1610]
      ],
      "distanceMeters": 1850,
      "estimatedMinutes": 22,
      "minimumElevationMeters": 216,
      "description": "Elevated bypass corridor via Chittoor flyover; avoids submerged Kangeyanallur bridge."
    },
    "blockedHazardAvoided": {
      "hazardId": "haz-1",
      "roadName": "Kangeyanallur Causeway",
      "waterDepthFeet": 4.8
    }
  }
}
```

---

## ⚡ MODULE 7: REAL-TIME WEBSOCKET / SSE FEED
Allows the Commander Desk and Citizen Mobile screens to sync without page refresh.
* **Protocol**: WebSocket (`ws://localhost:5000/ws/crisis`) or Server-Sent Events (`GET /api/v1/stream/events`)
* **Event Types Emitted**:
  * `THREAT_BROADCAST_CHANGED`: `{ stage: "DANGER", videoCode: "d.mp4" }`
  * `NEW_SOS_TRIGGERED`: `{ id: "sos-1082", urgencyScore: 96, priority: "P1_CRITICAL" }`
  * `BOAT_DISPATCHED`: `{ sosId: "sos-1082", unitName: "NDRF Zodiac Unit #5" }`
  * `VICTIM_RESCUED`: `{ sosId: "sos-1082", trappedCount: 4 }`
  * `HAZARD_VERIFIED`: `{ hazardId: "haz-1", roadName: "Kangeyanallur Causeway" }`

---

## 💡 Quickstart Express.js / Node.js Template for Teammates
Share this with your backend developers so they can spin up the server in 5 minutes:

```javascript
// server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Database State
let broadcastStage = 'DANGER';
let boatsDeployed = 4;
let sosQueue = [
  {
    id: 'sos-1',
    citizenName: 'Kalyani Ramanathan',
    phone: '+91 98412 87612',
    landmark: 'Shenbakkam 2nd Cross',
    trappedCount: 4,
    urgencyScore: 96,
    priorityLevel: 'P1_CRITICAL',
    status: 'WAITING_DISPATCH'
  }
];

// 1. Threat Broadcast Endpoint
app.get('/api/v1/broadcast/current', (req, res) => {
  res.json({ success: true, data: { stage: broadcastStage } });
});

app.post('/api/v1/broadcast/override', (req, res) => {
  broadcastStage = req.body.stage || 'DANGER';
  res.json({ success: true, data: { stage: broadcastStage } });
});

// 2. SOS Endpoints
app.get('/api/v1/sos', (req, res) => {
  res.json({ success: true, data: sosQueue });
});

app.post('/api/v1/sos', (req, res) => {
  const newSOS = { id: `sos-${Date.now()}`, ...req.body, status: 'WAITING_DISPATCH' };
  sosQueue.unshift(newSOS);
  res.status(201).json({ success: true, data: newSOS });
});

app.patch('/api/v1/sos/:id/dispatch', (req, res) => {
  const item = sosQueue.find(s => s.id === req.params.id);
  if (item) {
    item.status = 'RESCUE_BOAT_DISPATCHED';
    item.dispatchedUnit = req.body.unitName || 'NDRF Boat Unit';
    boatsDeployed++;
  }
  res.json({ success: true, data: item });
});

app.patch('/api/v1/sos/:id/rescue', (req, res) => {
  const item = sosQueue.find(s => s.id === req.params.id);
  if (item) item.status = 'RESCUED';
  res.json({ success: true, data: item });
});

app.listen(5000, () => console.log('SurakshaSetu API running on port 5000'));
```
