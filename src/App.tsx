import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MultiHazardBar } from './components/MultiHazardBar';
import { RiskEngineWidget } from './components/RiskEngineWidget';
import { StatusStageHero } from './components/StatusStageHero';
import { InteractiveMap } from './components/InteractiveMap';
import { ShelterDrawer } from './components/ShelterDrawer';
import { RadialHoldSOSModal, RadialSOSButton } from './components/RadialHoldSOSModal';
import { HazardReportModal } from './components/HazardReportModal';
import { NDRFCommandCenter } from './components/NDRFCommandCenter';
import { FieldPersonnelPortal } from './components/FieldPersonnelPortal';
import { CalamityStudio } from './components/CalamityStudio';
import { OfflineRescueKit } from './components/OfflineRescueKit';
import { FamilyReunionModal } from './components/FamilyReunionModal';
import { CrisisAPI, subscribeCrisisMesh } from './services/api';

import type {
  AppMode,
  Language,
  Shelter,
  HazardIncident,
  SOSRequest,
  PalarTelemetry,
  CalamityType,
  MissingPersonReport,
  SafeCheckIn,
  CalamityDials,
} from './types/disaster';
import {
  INITIAL_TELEMETRY,
  INITIAL_SHELTERS,
  INITIAL_HAZARDS,
  INITIAL_SOS_REQUESTS,
  INITIAL_MISSING_PERSONS,
  INITIAL_SAFE_CHECKINS,
} from './data/mockVelloreData';
import { WifiOff, ShieldCheck, ArrowLeft, Map as MapIcon, Users } from 'lucide-react';

export function App() {
  const [mode, setMode] = useState<AppMode>('CITIZEN');
  const [lang, setLang] = useState<Language>('en');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [selectedHazard, setSelectedHazard] = useState<CalamityType>('FLOOD');

  // Citizen view state: 'GUIDE' (Animated Stages + Action Cards) vs 'MAP' (Evacuation Map)
  const [citizenView, setCitizenView] = useState<'GUIDE' | 'MAP'>('GUIDE');

  // Emergency threat broadcast controlled from DEOC / NDRF Command Center
  // 'DANGER' (d.mp4), 'NEAR_DANGER' (nd.mp4), 'SAFE' (s.mp4)
  const [broadcastStage, setBroadcastStage] = useState<'DANGER' | 'NEAR_DANGER' | 'SAFE'>('DANGER');
  const [autoLoop, setAutoLoop] = useState<boolean>(false);

  // Auto-cycle demo simulation when enabled from the controller desk
  useEffect(() => {
    if (!autoLoop) return;
    const interval = setInterval(() => {
      setBroadcastStage((prev) => {
        if (prev === 'DANGER') return 'NEAR_DANGER';
        if (prev === 'NEAR_DANGER') return 'SAFE';
        return 'DANGER';
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [autoLoop]);

  // Core Real-Time Data State
  const [telemetry, setTelemetry] = useState<PalarTelemetry>(INITIAL_TELEMETRY);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [hazards, setHazards] = useState<HazardIncident[]>(INITIAL_HAZARDS);
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>(INITIAL_SOS_REQUESTS);
  const [missingPersons, setMissingPersons] = useState<MissingPersonReport[]>(INITIAL_MISSING_PERSONS);
  const [safeCheckIns, setSafeCheckIns] = useState<SafeCheckIn[]>(INITIAL_SAFE_CHECKINS);

  // Calamity Studio Real-time Dials State
  const [calamityDials, setCalamityDials] = useState<CalamityDials>({
    palarDischargeCusecs: 14500,
    riverGaugeMeters: 5.8,
    mordhanaDamCusecs: 6000,
    cycloneWindKmh: 24,
    streetInundationFeet: 1.2,
    gridPowerOutage: false,
  });

  // Cross-Window Crisis Event Mesh & Initial Backend Data Fetch
  useEffect(() => {
    const unsubscribe = subscribeCrisisMesh((msg) => {
      switch (msg.type) {
        case 'BROADCAST_STAGE_CHANGE':
          if (msg.payload?.stage) setBroadcastStage(msg.payload.stage);
          break;
        case 'CALAMITY_DIALS_UPDATE':
          if (msg.payload) {
            setCalamityDials(msg.payload);
            // Dynamically recalculate river gauge in telemetry
            setTelemetry((prev) => ({
              ...prev,
              dischargeRateCusecs: msg.payload.palarDischargeCusecs,
              riverGaugeMeters: msg.payload.riverGaugeMeters,
              mordhanaDamDischargeCusecs: msg.payload.mordhanaDamCusecs,
            }));
          }
          break;
        case 'NEW_SOS':
          if (msg.payload?.id) {
            setSosRequests((prev) => [msg.payload, ...prev.filter((r) => r.id !== msg.payload.id)]);
          }
          break;
        case 'SOS_DISPATCH':
          if (msg.payload?.sosId) {
            setSosRequests((prev) =>
              prev.map((r) =>
                r.id === msg.payload.sosId
                  ? { ...r, status: 'RESCUE_BOAT_DISPATCHED', dispatchedUnit: msg.payload.unitName }
                  : r
              )
            );
          }
          break;
        case 'NEW_HAZARD':
          if (msg.payload?.id) {
            setHazards((prev) => [msg.payload, ...prev.filter((h) => h.id !== msg.payload.id)]);
          }
          break;
        case 'SHELTER_INTAKE':
          if (msg.payload?.shelterId) {
            setShelters((prev) =>
              prev.map((s) =>
                s.id === msg.payload.shelterId
                  ? {
                      ...s,
                      capacityOccupied: Math.min(
                        s.capacityTotal,
                        s.capacityOccupied + (msg.payload.additionalOccupancy || 0)
                      ),
                    }
                  : s
              )
            );
          }
          break;
      }
    });

    // Try fetching live records from backend API server if running
    CrisisAPI.getSOSRequests().then((data) => {
      if (data && data.length > 0) setSosRequests(data);
    });
    CrisisAPI.getHazards().then((data) => {
      if (data && data.length > 0) setHazards(data);
    });
    CrisisAPI.getShelters().then((data) => {
      if (data && data.length > 0) setShelters(data);
    });

    return unsubscribe;
  }, []);

  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(shelters[0]);
  const [drawerTab, setDrawerTab] = useState<'SHELTERS' | 'REPORT' | 'SURVIVAL'>('SHELTERS');

  // Modal States
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isHazardOpen, setIsHazardOpen] = useState<boolean>(false);
  const [isHelplinesOpen, setIsHelplinesOpen] = useState<boolean>(false);
  const [isReunionOpen, setIsReunionOpen] = useState<boolean>(false);

  // Citizen Actions
  const handleNewSOS = (newRequest: SOSRequest) => {
    setSosRequests((prev) => [newRequest, ...prev]);
  };

  const handleNewHazard = (newHazard: HazardIncident) => {
    setHazards((prev) => [newHazard, ...prev]);
  };

  // NDRF Command Actions
  const handleDispatchUnit = (id: string, unitName: string) => {
    setSosRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'RESCUE_BOAT_DISPATCHED',
              dispatchedUnit: unitName,
            }
          : r
      )
    );
  };

  const handleMarkRescued = (id: string) => {
    setSosRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'RESCUED',
            }
          : r
      )
    );
  };

  const handleVerifyHazard = (id: string) => {
    setHazards((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, status: 'AUTHORITY_VERIFIED', upvotes: h.upvotes + 5 } : h
      )
    );
  };

  return (
    <div
      className={`min-h-screen text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white ${
        mode === 'CITIZEN' && citizenView === 'GUIDE' ? 'bg-transparent' : 'bg-slate-950'
      }`}
    >
      {/* 1. Tactical Navigation Bar */}
      <Navbar
        mode={mode}
        setMode={setMode}
        lang={lang}
        setLang={setLang}
        isOffline={isOffline}
        setIsOffline={setIsOffline}
        onOpenHelplines={() => setIsHelplinesOpen(true)}
      />

      {/* Offline Status Warning Banner */}
      {isOffline && (
        <div className="bg-amber-950 border-b border-amber-500/80 px-3 py-1.5 text-xs text-amber-200 flex items-center justify-between z-30">
          <div className="flex items-center gap-2 font-bold">
            <WifiOff size={14} className="animate-pulse text-amber-400" />
            <span>
              {lang === 'en'
                ? '⚡ ZERO-CONNECTIVITY OFFLINE MODE: Running on local cache. SMS fallback active.'
                : lang === 'hi'
                ? '⚡ ऑफलाइन मोड: इंटरनेट के बिना भी आपातकालीन निर्देश सक्रिय हैं।'
                : '⚡ ஆஃப்லைன் பயன்முறை: இணையம் இல்லாத நிலையிலும் வழிகாட்டுதல் செயல்படுகிறது.'}
            </span>
          </div>
          <button
            onClick={() => setIsOffline(false)}
            className="text-[11px] underline text-amber-300 hover:text-white font-semibold"
          >
            {lang === 'en' ? 'Restore Online' : 'இணைக்க'}
          </button>
        </div>
      )}

      {/* Multi-Hazard Extensibility Selector (Visible on Map & Command Center views) */}
      {!(mode === 'CITIZEN' && citizenView === 'GUIDE') && (
        <MultiHazardBar
          selectedHazard={selectedHazard}
          onSelectHazard={setSelectedHazard}
          lang={lang}
        />
      )}

      {/* Decision-Support Risk Formula Breakdown Widget (Visible on Map & Command Center views) */}
      {!(mode === 'CITIZEN' && citizenView === 'GUIDE') && (
        <RiskEngineWidget weights={telemetry.riskBreakdown} lang={lang} />
      )}

      {/* 2. Main Body: 4 Interconnected Operational Portals */}
      {mode === 'CITIZEN' || mode === 'CITIZEN_HELP' ? (
        <main className="flex-1 flex flex-col relative">
          {/* Sub-toggle: Guide vs Map */}
          <div className="bg-black/60 backdrop-blur-md border-b border-white/10 px-4 py-2 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCitizenView('GUIDE')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  citizenView === 'GUIDE'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🛡️ {lang === 'en' ? 'Status & Guide' : lang === 'hi' ? 'सुरक्षा स्थिति' : 'பாதுகாப்பு நிலை'}
              </button>

              <button
                onClick={() => setCitizenView('MAP')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  citizenView === 'MAP'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapIcon size={12} />
                <span>{lang === 'en' ? 'Evacuation Map' : lang === 'hi' ? 'नक्शा' : 'வரைபடம்'}</span>
              </button>
            </div>

            {/* Family Safe Check-In Shortcut */}
            <button
              onClick={() => setIsReunionOpen(true)}
              className="text-xs bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
            >
              <Users size={12} />
              <span>{lang === 'en' ? 'Family Check-In' : lang === 'hi' ? 'परिवार चेक-इन' : 'குடும்ப பதிவு'}</span>
            </button>
          </div>

          {/* View A: The Human-First Animated Status Stages Hero (DEFAULT) */}
          {citizenView === 'GUIDE' ? (
            <StatusStageHero
              stage={broadcastStage}
              autoLoop={autoLoop}
              onOpenSOS={() => setIsSOSOpen(true)}
              onOpenMap={() => setCitizenView('MAP')}
              onOpenShelters={() => {
                setCitizenView('MAP');
                setDrawerTab('SHELTERS');
              }}
              onOpenHelplines={() => setIsHelplinesOpen(true)}
              lang={lang}
            />
          ) : (
            /* View B: The Tactical GIS Evacuation Leaflet Map */
            <div className="flex-1 relative flex flex-col">
              <InteractiveMap
                shelters={shelters}
                hazards={hazards}
                sosRequests={sosRequests}
                selectedShelter={selectedShelter}
                onSelectShelter={(shelter) => setSelectedShelter(shelter)}
                onReportHazard={() => setIsHazardOpen(true)}
                lang={lang}
              />

              {/* Slide-over Shelter & Route Drawer */}
              <ShelterDrawer
                shelters={shelters}
                selectedShelter={selectedShelter}
                onSelectShelter={(shelter) => setSelectedShelter(shelter)}
                activeTab={drawerTab}
                setActiveTab={(tab) => {
                  setDrawerTab(tab);
                  if (tab === 'SURVIVAL') setIsHelplinesOpen(true);
                }}
                onOpenReportModal={() => setIsHazardOpen(true)}
                lang={lang}
              />
            </div>
          )}

          {/* Floating Radial Hold SOS Button (Thumb-zone trigger) */}
          <RadialSOSButton onTrigger={() => setIsSOSOpen(true)} lang={lang} />
        </main>
      ) : mode === 'COMMAND_CENTER' ? (
        /* Page 2: NDRF & District Collector Command Dashboard */
        <main className="flex-1 flex flex-col">
          <NDRFCommandCenter
            sosRequests={sosRequests}
            shelters={shelters}
            hazards={hazards}
            onDispatchUnit={handleDispatchUnit}
            onMarkRescued={handleMarkRescued}
            onVerifyHazard={handleVerifyHazard}
            broadcastStage={broadcastStage}
            onSetBroadcastStage={(st) => {
              setBroadcastStage(st);
              setAutoLoop(false);
              CrisisAPI.broadcastStageOverride(st);
            }}
            autoLoop={autoLoop}
            onToggleAutoLoop={() => setAutoLoop(!autoLoop)}
            onViewCitizenScreen={() => setMode('CITIZEN_HELP')}
            lang={lang}
          />
        </main>
      ) : mode === 'FIELD_RESPONDER' ? (
        /* Page 3: NDRF Personnel & Volunteer Field Desk */
        <main className="flex-1 flex flex-col">
          <FieldPersonnelPortal
            sosRequests={sosRequests}
            shelters={shelters}
            onUpdateSOSStatus={(id, status) => {
              setSosRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
            }}
            onAddHazard={handleNewHazard}
            onShelterIntake={(shelterId, count) => {
              setShelters((prev) =>
                prev.map((s) =>
                  s.id === shelterId
                    ? { ...s, capacityOccupied: Math.min(s.capacityTotal, s.capacityOccupied + count) }
                    : s
                )
              );
            }}
            lang={lang}
          />
        </main>
      ) : (
        /* Page 4: Live Calamity Simulation Studio */
        <main className="flex-1 flex flex-col">
          <CalamityStudio
            currentDials={calamityDials}
            onUpdateDials={setCalamityDials}
            onAddHazard={handleNewHazard}
            lang={lang}
          />
        </main>
      )}

      {/* 3. Emergency Modals */}
      <RadialHoldSOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        onSubmitSOS={handleNewSOS}
        isOffline={isOffline}
        lang={lang}
      />

      <HazardReportModal
        isOpen={isHazardOpen}
        onClose={() => setIsHazardOpen(false)}
        onSubmitHazard={handleNewHazard}
        lang={lang}
      />

      <OfflineRescueKit
        isOpen={isHelplinesOpen}
        onClose={() => setIsHelplinesOpen(false)}
        lang={lang}
      />

      <FamilyReunionModal
        isOpen={isReunionOpen}
        onClose={() => setIsReunionOpen(false)}
        missingPersons={missingPersons}
        safeCheckIns={safeCheckIns}
        onAddSafeCheckIn={(c) => setSafeCheckIns((prev) => [c, ...prev])}
        onReportMissing={(m) => setMissingPersons((prev) => [m, ...prev])}
        lang={lang}
      />

      {/* Minimal Footer */}
      <footer
        className={`border-t px-4 py-2 text-center text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 z-20 ${
          mode === 'CITIZEN' && citizenView === 'GUIDE'
            ? 'bg-black/80 backdrop-blur-md border-white/10'
            : 'bg-slate-950 border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>SurakshaSetu • VinHack 2026 • VIT Vellore</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span>Multi-Hazard Early-Warning & Evacuation Engine</span>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-400 font-mono">ALL SYSTEMS OPERATIONAL</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
