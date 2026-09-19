# 🛡️ SurakshaSetu (सुरक्षा सेतु / சுரக்ஷா சேது)
### Multi-Hazard Crisis Intelligence and Evacuation Platform
**Built for VinHack 2026 — VIT Vellore**

---

## 🌊 The Context: Vellore & The Palar River Basin
During severe monsoons or sudden reservoir discharges from the Mordhana Dam and Andhra check dams, the historically dry **Palar River** experiences violent flash floods. Low-lying settlements along the banks—such as **Konavattam, Shenbakkam, Saidapet, and Kansalpet**—and critical transportation choke points like the **Katpadi Railway Underpass** and the **Kangeyanallur low-level causeway** become submerged under 4–6 feet of raging floodwaters.

Standard weather apps merely announce: *"Heavy rain expected in interior Tamil Nadu."* 

**SurakshaSetu bridges the gap between passive forecast and tactical survival action:**
> *"Ward 12 (Katpadi) water level rising. Kangeyanallur Causeway is submerged under 4.8ft of water. Proceed to VIT Indoor Sports Complex Relief Camp via the Elevated Bypass Route (Safe Corridor). Available capacity: 116 beds, solar power active. If marooned, press SOS."*

---

## 🚀 Key Technical Highlights (Why This Project Wins)

1. **Cinematic Human-First Hero with Remote DEOC Controller**
   * High-definition, cinema-grade looping crisis feed (`d.mp4` for Full Danger, `nd.mp4` for Nearby Danger / Watch Zone, `s.mp4` for Safe Haven).
   * **Only ONE active video stream plays at any time**, ensuring zero browser lag or memory bloat.
   * **Controlled remotely from the Command Center**: Citizens do not manually change danger states; the District Emergency Operations Centre (DEOC 1077) selects the active threat level, and all citizen phones react instantaneously.

2. **Deterministic Multi-Factor Triage Urgency Algorithm**
   * Implements automated triage scoring ($S \in [0, 100]$) prioritizing infants, pregnant women, bedridden/elderly citizens, oxygen/dialysis medical emergencies, and roof-stranded victims.
   * Feeds directly into a prioritized dispatch queue for the **NDRF 4th Battalion (Arakkonam)** and **Vellore DEOC (1077)**.

3. **Hazard-Constrained Safe Route Routing Engine**
   * Dynamically tracks blocked causeways and inundated underpasses.
   * Compares the **Submerged Direct Route (Red)** vs the **Elevated Safe Evacuation Corridor (Green)** to direct citizens around waterlogged choke points.

4. **Tactical Radial Hold SOS with SMS Fallback**
   * 1.5-second press-and-hold trigger with SVG radial countdown ring to eliminate panic misclicks while wading through water.
   * Automatic offline fallback: Encodes a pre-formatted distress string (`sms:1077?body=SOS%20...`) that can be beamed via standard cellular SMS even when mobile data and the internet grid are completely down.

5. **Dual Synchronized Interfaces**
   * **Citizen View:** Cinema-grade threat hero, emotional survival quotes, live inundation/elevation badges, and 4 thumb-friendly action cards (SOS, Nearest Camp, Evacuation Map, Helplines).
   * **NDRF / DEOC Command Center:** Live threat broadcast override desk (`d.mp4`, `nd.mp4`, `s.mp4`, Auto Loop 6s), real-time priority triage dispatch feed, boat deployment tracker, and hazard verification desk.

6. **Trilingual Local Accessibility (English / हिन्दी / தமிழ்)**
   * Instant 1-tap localization for Tamil Nadu citizens and national disaster relief teams.

7. **Offline Zero-Connectivity Emergency Kit**
   * Pre-cached emergency guides, life-safety electrical protocols, and 1-tap dialers for `1077`, `1070`, `108`, `101`, and `1912`.

---

## 🏃 Running the Application Locally

```bash
# Navigate to the project directory
cd C:\Users\OJUS\suraksha-setu

# Start the Vite development server
npm run dev

# Open in browser:
http://localhost:5173
```

---

## 🎬 Video Asset Architecture (`public/`)
- `public/d.mp4` / `public/D.mp4` — **Full Danger Zone (Level 3)**: Raging floodwaters, surging water levels, evacuation order.
- `public/nd.mp4` / `public/ND.mp4` — **Nearby Danger (Level 2)**: Approaching water, watch and prepare advisory.
- `public/s.mp4` / `public/S.mp4` — **Safe Haven (Level 1)**: VIT Indoor Stadium camp, beds, hot food, clean water.

---

## 🎤 The 3-Minute Winning Demo Script for Judges

* **0:00 - 0:45 (The Problem & Human-First Hero):**
  * *"Judges, when floods strike Vellore, a raw map full of technical pins confuses and panics a farmer or family. SurakshaSetu starts with human clarity: an unmistakable, high-definition crisis status pane with live telemetry and grounding survival quotes."*
  * Show the Citizen Screen on `http://localhost:5173`. Point to the active `d.mp4` video feed and the 4 clear, thumb-friendly action cards.

* **0:45 - 1:30 (The Controller Window Magic):**
  * Switch to **NDRF / Collectorate Command** view in the navbar (or click *"Open Controller Desk to change video"*).
  * *"The citizen's phone doesn't guess the danger level—the District Emergency Operations Centre (1077) controls the broadcast."*
  * Click **`BROADCAST: nd.mp4`** or **`BROADCAST: s.mp4`** (or toggle **`▶️ AUTO LOOP (6s)`**).
  * Click **`👁️ View Citizen Screen`**: Show judges how the citizen interface dynamically updates its video feed, safety quotes, and elevation badges without lag.

* **1:30 - 2:15 (Emergency SOS & Triage Algorithm):**
  * Return to Citizen View. Hold down the **Radial SOS button** for 1.5 seconds.
  * Check *"Infant present"*, *"Elderly present"*, and *"Water at 1st floor"*.
  * Show the live **Urgency Score compute to 96/100 (P1 - CRITICAL)**.
  * Click *"Transmit SOS"*.

* **2:15 - 2:45 (NDRF Command Center Dispatch):**
  * Switch back to Command Center.
  * Show the distress call sitting at the very top of the live triage queue.
  * Click **"Dispatch NDRF Rescue Boat"** $\rightarrow$ status updates to *Unit Dispatched*.

* **2:45 - 3:00 (Offline Resilience & Safe Routing):**
  * Toggle **Offline Mode** in the navbar: highlight the zero-connectivity local cache and SMS fallback (`sms:1077`).
  * Show the **Evacuation Map**: contrast the submerged Kangeyanallur bridge (Red) with the elevated bypass corridor (Green).
  * Conclude: *"SurakshaSetu turns helpless alerts into coordinated, life-saving action."*
