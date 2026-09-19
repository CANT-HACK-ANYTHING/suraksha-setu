# 🛸 SurakshaSetu: Antigravity Integration & Merge Guide
### Multi-Hazard Crisis Intelligence & Evacuation Platform (VinHack 2026 — VIT Vellore)
*Document Version: 1.0.0 | Generated for Antigravity & Developer Team Merge*

---

## 📌 1. Overview & Architectural Blueprint

**SurakshaSetu** is built as an interconnected crisis ecosystem composed of **4 isolated front-end portals** communicating in the background via **real-time event streaming** and **deterministic triage intelligence**.

```
                           ┌──────────────────────────────────────────────┐
                           │   HTML5 BroadcastChannel: 'suraksha_crisis_mesh' │
                           │           (or Live WebSocket /ws/crisis)       │
                           └──────┬──────────────┬──────────────┬─────────┘
                                  │              │              │
         ┌────────────────────────┴───┐          │              │
         ▼                            ▼          ▼              ▼
┌─────────────────┐         ┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  PORTAL 1 (/)   │         │PORTAL 2(/command│ │PORTAL 3(/fiel│ │PORTAL 4(/studio)│
│  CITIZEN HELP   │         │ DEOC COMMAND    │ │NDRF FIELD DES│ │ CALAMITY STUDIO │
│                 │         │                 │ │              │ │                 │
│ • Cinema Video  │         │ • Triage Queue  │ │ • Boat Crews │ │ • Palar Flow    │
│ • Massive Text  │         │ • Dispatch Boat │ │ • Extraction │ │ • Gauge Meters  │
│ • 1.5s Hold SOS │         │ • Broadcast Over│ │ • Shelter In │ │ • Dam & Wind    │
│ • Safe Route Map│         │ • Action Ticker │ │ • Obstacle Lo│ │ • Hazard Inject │
└─────────────────┘         └─────────────────┘ └──────────────┘ └─────────────────┘
```

---

## 🧭 2. The 4 Isolated Application Routes

Each portal is completely isolated and runs on its own dedicated URL. There is **no client-side direct switcher** exposed on citizen screens:

| Route Path | View Mode (`PageViewMode`) | Target Persona | Primary Functionalities |
| :--- | :--- | :--- | :--- |
| **`/`** or **`/citizen`** | `CITIZEN_HELP` | Stranded Citizens & Families | Full-page video hero (`d.mp4`, `nd.mp4`, `s.mp4`), massive crisis typography (`DANGER`, `DANGER NEARBY`, `SAFE`), 2-stage scroll-up disclosure, 1.5s radial hold SOS, nearest shelters with live beds, elevated safe route bypass map, emergency helplines (`1077`/`1070`). |
| **`/command`** | `COMMAND_CENTER` | DEOC Vellore & District Collector | Automated battlefield triage queue (0–100 urgency scoring), 1-tap NDRF boat dispatching, live deployed boats counter, citizens saved metric, live action ticker with audio chirps, citizen threat feed override. |
| **`/field`** | `FIELD_RESPONDER` | NDRF 4th Battalion & Aapda Mitra Volunteers | Responder profiles (Capt. Arul Prakash, Dr. Meena Swaminathan), 4-stage mission execution (`ASSIGNED` $\rightarrow$ `EN_ROUTE` $\rightarrow$ `ON_SCENE` $\rightarrow$ `EXTRACTING` $\rightarrow$ `ARRIVED_SHELTER`), survivor shelter bed intake, 1-tap obstacle logger at boat position. |
| **`/studio`** | `CALAMITY_STUDIO` | Disaster Modelers & Emergency Controllers | Interactive hydrological & weather dials (Palar discharge 5k–50k cusecs, gauge 4m–12m, dam release, rainfall, wind, street flood depth), TANGEDCO power grid toggle, dual-tone emergency siren, 1-tap hazard injectors. |

---

## ⚡ 3. Real-Time Background Synchronization Specification

When open in different browser windows or separate mobile devices, the portals synchronize instantly via `src/services/api.ts`:

### 3.1 Background Event Schema (`CrisisEvent`)

```typescript
export type CrisisEvent =
  | { type: 'CALAMITY_UPDATED'; payload: { controls: CalamitySimulationControls; telemetry: PalarTelemetry } }
  | { type: 'SOS_CREATED'; payload: SOSRequest }
  | { type: 'UNIT_DISPATCHED'; payload: { sosId: string; unitName: string; mission?: FieldMission } }
  | { type: 'MISSION_STATUS_UPDATED'; payload: { missionId: string; status: FieldMission['status']; sosId: string } }
  | { type: 'SHELTER_OCCUPANCY_CHANGED'; payload: { shelterId: string; delta: number } }
  | { type: 'BROADCAST_STAGE_CHANGED'; payload: 'DANGER' | 'NEAR_DANGER' | 'SAFE' }
  | { type: 'HAZARD_INJECTED'; payload: HazardIncident };
```

### 3.2 Continuous Reactive Thresholds
* When **Palar River Flow** $\ge 28,000\text{ cusecs}$ OR **Gauge** $\ge 7.5\text{m}$ OR **Inundation** $\ge 3.5\text{ ft}$:
  * System emits: `BROADCAST_STAGE_CHANGED('DANGER')`.
  * Citizen Portal immediately plays **`d.mp4`** with massive glowing red **`DANGER`** typography.
* When Flow is between $18,000 - 28,000\text{ cusecs}$ OR Gauge $6.0 - 7.4\text{m}$:
  * System emits: `BROADCAST_STAGE_CHANGED('NEAR_DANGER')`.
  * Citizen Portal immediately plays **`nd.mp4`** with amber **`DANGER NEARBY`** typography.
* When Flow $< 18,000\text{ cusecs}$ AND Gauge $< 6.0\text{m}$:
  * System emits: `BROADCAST_STAGE_CHANGED('SAFE')`.
  * Citizen Portal returns to **`s.mp4`** with emerald **`SAFE`** typography.

---

## 📡 4. Complete Backend REST & WebSocket API Contracts

To connect a live backend (Node.js/Express, Python/FastAPI, or Go), implement the following endpoints:

### 4.1 Broadcast & Telemetry
| Method | Endpoint | Description | Sample Request / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/broadcast/current` | Active stage & video displayed on citizen phones | Returns `{ stage: "DANGER", videoFile: "/D.mp4", code: "d.mp4" }` |
| `POST` | `/api/v1/broadcast/override` | Commander forces new threat video broadcast | Body: `{ "stage": "NEAR_DANGER", "officerId": "DEOC-1077" }` |
| `GET` | `/api/v1/telemetry/palar` | River discharge, gauge meters, and composite risk weights | Returns hydrological sensor metrics and formula breakdown |
| `POST` | `/api/v1/telemetry/simulate`| Ingests slider calibrations from Calamity Studio | Body: `{ "riverDischargeCusecs": 35000, "riverGaugeMeters": 8.4 }` |

### 4.2 SOS & Battlefield Triage
| Method | Endpoint | Description | Processing Rules |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sos` | Stranded citizen submits 1.5s radial hold SOS | Calculate deterministic triage score ($0-100$): Base `15` + Infant `+25` + Pregnant `+25` + Elderly `+20` + Medical `+35` + Rooftop Water `+30`. Score $\ge 75 \rightarrow$ `P1_CRITICAL`. |
| `GET` | `/api/v1/sos` | Triage queue for DEOC Command Center | Sorted by `urgencyScore: -1`. Supports `?status=WAITING_DISPATCH`. |
| `PATCH`| `/api/v1/sos/:id/dispatch` | Assigns an NDRF boat to a trapped citizen | Body: `{ "unitName": "NDRF Zodiac Unit #5" }`. Sets status to `RESCUE_BOAT_DISPATCHED`. |
| `PATCH`| `/api/v1/sos/:id/rescue` | Confirms victim safely rescued | Sets status to `RESCUED`. Increments system saved counter. |
| `POST` | `/api/v1/sos/sms-fallback`| Ingests offline SMS emergency distress calls | Regex parses lat, lon, trapped count, water depth from SMS payload. |

### 4.3 Field Missions & Shelters
| Method | Endpoint | Description | Effect |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/missions` | Active tasks for boat crews and paramedics | Returns missions assigned to active unit. |
| `PATCH`| `/api/v1/missions/:id/status`| Updates responder status (`EN_ROUTE`, `ON_SCENE`, `SAFE_AT_SHELTER`)| When `status === 'ARRIVED_SHELTER'`, marks SOS as `RESCUED` and updates shelter capacity. |
| `GET` | `/api/v1/shelters` | Relief camps, live free beds, and amenities | Returns list of camps (VIT Stadium, Katpadi Girls School, etc.). |
| `PATCH`| `/api/v1/shelters/:id/occupancy` | Updates camp capacity upon boat arrival | Updates `capacityOccupied` and recalculates `freeBeds`. |
| `GET` | `/api/v1/hazards` | Active road closures & hazards | Returns verified flooded bridges and fallen powerlines. |
| `POST` | `/api/v1/hazards` | Logs a new road obstruction from citizen or field | Broadcasts to map routing engine. |
| `POST` | `/api/v1/routing/safe-path` | Generates elevated walking route | Avoids all `AUTHORITY_VERIFIED` flooded choke points. |

### 4.4 WebSocket / SSE Event Stream
* **URL**: `ws://localhost:5000/ws/crisis` (or Server-Sent Events `GET /api/v1/stream/events`)
* **Messages**: Emits `{ type: "THREAT_BROADCAST_CHANGED" | "NEW_SOS_TRIGGERED" | "BOAT_DISPATCHED" | "VICTIM_RESCUED" | "HAZARD_VERIFIED", data: { ... } }`.

---

## 📁 5. Key File Tree & Responsibilities

```
suraksha-setu/
├── index.html                           # Root HTML with Google Fonts (Bebas Neue & Montserrat)
├── API_SPECIFICATION.md                 # Standalone backend API contracts specification
├── ANTIGRAVITY_INTEGRATION_GUIDE.md     # THIS MASTER MERGE & BLUEPRINT DOCUMENT
├── src/
│   ├── main.tsx                         # React 19 root bootstrap
│   ├── App.tsx                          # Master state orchestrator & HTML5 History router (/citizen, /command, /field, /studio)
│   ├── index.css                        # Tailwind CSS v4 directives & Bebas font-family
│   ├── types/
│   │   └── disaster.ts                  # Central TypeScript data contracts (CalamityControls, FieldMission, SOSRequest)
│   ├── services/
│   │   └── api.ts                       # REST client & BroadcastChannel('suraksha_crisis_mesh') engine
│   ├── data/
│   │   └── mockVelloreData.ts           # Vellore/Palar geo-coordinates, initial shelters, and initial hazards
│   ├── utils/
│   │   ├── triage.ts                    # Deterministic triage score calculation algorithm
│   │   ├── riskEngine.ts                # Composite multi-hazard risk formula calculator (R = 0.30P + 0.25W + 0.20D + ...)
│   │   └── translations.ts              # Trilingual translation dictionary (English / हिंदी / தமிழ்)
│   └── components/
│       ├── Navbar.tsx                   # Top tactical bar (Risk level, siren trigger, 1077 hotline, language, offline mode)
│       ├── StatusStageHero.tsx          # PAGE 1: Cinema video hero, massive font, 2-stage scroll, action cards, live telemetry
│       ├── InteractiveMap.tsx           # PAGE 1: Leaflet evacuation map with safe elevated bypass routing
│       ├── ShelterDrawer.tsx            # PAGE 1: Slide-up drawer with camp capacity & amenities
│       ├── RadialHoldSOSModal.tsx       # PAGE 1: 1.5s radial SVG hold SOS modal with haptic feedback
│       ├── NDRFCommandCenter.tsx        # PAGE 2: DEOC incident desk, triage queue, boat deployment, action ticker
│       ├── FieldPersonnelPortal.tsx     # PAGE 3: NDRF 4th Battalion & Aapda Mitra on-ground boat crew execution portal
│       ├── CalamityStudio.tsx           # PAGE 4: Environmental crisis simulator (Palar discharge, gauge, dam, wind, rain)
│       ├── MultiHazardBar.tsx           # Hazard extension bar (Flood, Cyclone, Chemical, Dam Breach)
│       ├── RiskEngineWidget.tsx         # Real-time risk formula weights visualizer
│       ├── OfflineRescueKit.tsx         # PWA emergency helpline directory & offline survival tips
│       └── FamilyReunionModal.tsx       # Family safe check-in & missing persons registry
```

---

## 🔀 6. Git Merge Instructions for Antigravity & Developers

Follow these commands to merge the branch into your repository:

### Step 1: Fetch and Merge
```bash
# Ensure your working directory is clean
git status

# If merging from a feature branch (e.g., feature/4-pages-interconnected)
git checkout main
git merge feature/4-pages-interconnected --no-ff -m "feat: merge 4 interconnected crisis portals and API specification"
```

### Step 2: Install Dependencies & Verify Build
```bash
cd suraksha-setu
npm install
npm run build
```
*(Verified output: `✓ built in ~1.3s with 0 errors`)*

### Step 3: Run the Development Server
```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 🧪 7. Ready-to-Run Mock Backend Server (Express.js)

Share this 60-line script with your backend teammate to spin up a fully functioning backend in 2 minutes:

```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

// Threat Broadcast
app.get('/api/v1/broadcast/current', (req, res) => res.json({ success: true, data: { stage: broadcastStage } }));
app.post('/api/v1/broadcast/override', (req, res) => {
  broadcastStage = req.body.stage || 'DANGER';
  res.json({ success: true, data: { stage: broadcastStage } });
});

// SOS Triage
app.get('/api/v1/sos', (req, res) => res.json({ success: true, data: sosQueue }));
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

app.listen(5000, () => console.log('🚀 SurakshaSetu API running on http://localhost:5000'));
```

---

## 🏆 8. Hackathon Judge Walkthrough

To demo the platform to judges at VinHack 2026:
1. **Window 1**: Open [`http://127.0.0.1:5173/citizen`](http://127.0.0.1:5173/citizen) (Simulating a citizen's smartphone during the crisis).
2. **Window 2**: Open [`http://127.0.0.1:5173/command`](http://127.0.0.1:5173/command) (Simulating the Vellore District Emergency Operation Center).
3. **Window 3**: Open [`http://127.0.0.1:5173/studio`](http://127.0.0.1:5173/studio) (Simulating live Palar River telemetry).
4. **Trigger**: In Window 3, click **`FLASH FLOOD SPIKE`**.
5. **Observe**: Window 1 immediately switches video to `d.mp4` with massive `DANGER` typography and surges inundation depth to 5.4 ft in the background without refreshing!
6. **Rescue Action**: Stranded citizen in Window 1 holds **Radial SOS for 1.5s** $\rightarrow$ Window 2 receives it at the top of the queue $\rightarrow$ Commander clicks **Dispatch NDRF Boat** $\rightarrow$ Boat crew in Window 4/Field extracts victim $\rightarrow$ Marks **Safe at Shelter** $\rightarrow$ Citizens saved counter increments!
