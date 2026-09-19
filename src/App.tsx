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

import type {
  PageViewMode,
  Language,
  Shelter,
  HazardIncident,
  SOSRequest,
  PalarTelemetry,
  CalamityType,
  MissingPersonReport,
  SafeCheckIn,
  CalamitySimulationControls,
  FieldMission,
} from './types/disaster';
import { crisisApi, subscribeToCrisisEvents, broadcastCrisisEvent } from './services/api';
import {
  INITIAL_TELEMETRY,
  INITIAL_SHELTERS,
  INITIAL_HAZARDS,
  INITIAL_SOS_REQUESTS,
  INITIAL_MISSING_PERSONS,
  INITIAL_SAFE_CHECKINS,
} from './data/mockVelloreData';
import { WifiOff, ShieldCheck, ArrowLeft, Map as MapIcon, Users } from 'lucide-react';

const getModeFromUrl = (): PageViewMode => {
  if (typeof window === 'undefined') return 'CITIZEN_HELP';
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const page = search.get('page') || search.get('view') || search.get('tab');
  const hash = window.location.hash.toLowerCase();

  if (path.includes('command') || page === 'command' || hash.includes('command')) return 'COMMAND_CENTER';
  if (path.includes('field') || path.includes('volunteer') || path.includes('ndrf') || page === 'field' || hash.includes('field')) return 'FIELD_RESPONDER';
  if (path.includes('studio') || path.includes('calamity') || path.includes('issue') || page === 'studio' || hash.includes('studio')) return 'CALAMITY_STUDIO';
  return 'CITIZEN_HELP';
};

export function App() {
  const [mode, setMode] = useState<PageViewMode>(getModeFromUrl);

  const handleSetMode = (newMode: PageViewMode) => {
    setMode(newMode);
    const routeMap: Record<PageViewMode, string> = {
      CITIZEN_HELP: '/citizen',
      COMMAND_CENTER: '/command',
      FIELD_RESPONDER: '/field',
      CALAMITY_STUDIO: '/studio',
    };
    const targetPath = routeMap[newMode] || '/citizen';
    try {
      window.history.pushState({ mode: newMode }, '', targetPath);
    } catch {
      // History fallback
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setMode(getModeFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const [lang, setLang] = useState<Language>('en');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [selectedHazard, setSelectedHazard] = useState<CalamityType>('FLOOD');

  // Citizen view state: 'GUIDE' (Animated Stages + Action Cards) vs 'MAP' (Evacuation Map)
  const [citizenView, setCitizenView] = useState<'GUIDE' | 'MAP'>('GUIDE');

  // Emergency threat broadcast controlled from DEOC / NDRF Command Center
  const [broadcastStage, setBroadcastStage] = useState<'DANGER' | 'NEAR_DANGER' | 'SAFE'>('DANGER');
  const [autoLoop, setAutoLoop] = useState<boolean>(false);

  // Page 4: Calamity Simulation State
  const [calamityControls, setCalamityControls] = useState<CalamitySimulationControls>({
    riverDischargeCusecs: 31500,
    riverGaugeMeters: 8.4,
    mordhanaDamDischargeCusecs: 14200,
    windSpeedKmh: 45,
    rainfallMmPerHour: 85,
    inundationDepthFeet: 4.8,
    powerGridActive: false,
    sirenActive: false,
    activeCalamity: 'FLOOD',
  });

  // Page 3: Field Missions State
  const [missions, setMissions] = useState<FieldMission[]>([
    {
      id: 'mis-1',
      sosId: 'sos-1',
      responderId: 'vol-1',
      responderName: 'Capt. Arul Prakash (NDRF Boat #3)',
      responderType: 'NDRF_BOAT',
      status: 'EN_ROUTE',
      targetLocation: [12.9320, 79.1120],
      targetLandmark: 'Shenbakkam, 2nd Cross Street, near Mariamman Temple',
      trappedCount: 4,
      priorityLevel: 'P1_CRITICAL',
      waterLevel: 'FIRST_FLOOR_ROOFTOP',
      medicalUrgency: true,
      destinationShelterId: 'shelter-1',
      assignedAt: '8 mins ago',
      lastUpdateTimestamp: 'Just now',
    },
  ]);

  // Core Real-Time Data State
  const [telemetry, setTelemetry] = useState<PalarTelemetry>(INITIAL_TELEMETRY);
  const [shelters, setShelters] = useState<Shelter[]>(INITIAL_SHELTERS);
  const [hazards, setHazards] = useState<HazardIncident[]>(INITIAL_HAZARDS);
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>(INITIAL_SOS_REQUESTS);
  const [missingPersons, setMissingPersons] = useState<MissingPersonReport[]>(INITIAL_MISSING_PERSONS);
  const [safeCheckIns, setSafeCheckIns] = useState<SafeCheckIn[]>(INITIAL_SAFE_CHECKINS);

  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(shelters[0]);
  const [drawerTab, setDrawerTab] = useState<'SHELTERS' | 'REPORT' | 'SURVIVAL'>('SHELTERS');

  // Modal States
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isHazardOpen, setIsHazardOpen] = useState<boolean>(false);
  const [isHelplinesOpen, setIsHelplinesOpen] = useState<boolean>(false);
  const [isReunionOpen, setIsReunionOpen] = useState<boolean>(false);

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

  // Multi-window / Multi-tab real-time event synchronization
  // Multi-window / Multi-tab real-time event synchronization
  useEffect(() => {
    const unsubscribe = subscribeToCrisisEvents((event) => {
      switch (event.type) {
        case 'CALAMITY_UPDATED':
          setCalamityControls(event.payload.controls);
          setTelemetry(event.payload.telemetry);
          if (event.payload.controls.riverGaugeMeters >= 7.5 || event.payload.controls.riverDischargeCusecs >= 28000) {
            setBroadcastStage('DANGER');
          }
          break;
        case 'SOS_CREATED':
          setSosRequests((prev) => {
            if (prev.some((r) => r.id === event.payload.id)) return prev;
            return [event.payload, ...prev];
          });
          break;
        case 'UNIT_DISPATCHED':
          handleDispatchUnit(event.payload.sosId, event.payload.unitName, false);
          break;
        case 'MISSION_STATUS_UPDATED':
          handleUpdateMissionStatus(event.payload.missionId, event.payload.sosId, event.payload.status, undefined, false);
          break;
        case 'BROADCAST_STAGE_CHANGED':
          setBroadcastStage(event.payload);
          break;
        case 'HAZARD_INJECTED':
          setHazards((prev) => {
            if (prev.some((h) => h.id === event.payload.id)) return prev;
            return [event.payload, ...prev];
          });
          break;
      }
    });
    return unsubscribe;
  }, []);

  // Citizen Actions
  const handleNewSOS = async (newRequest: SOSRequest) => {
    setSosRequests((prev) => [newRequest, ...prev]);
    await crisisApi.submitSOS(newRequest);
  };

  const handleNewHazard = (newHazard: HazardIncident, broadcast = true) => {
    setHazards((prev) => [newHazard, ...prev]);
    if (broadcast) {
      broadcastCrisisEvent({ type: 'HAZARD_INJECTED', payload: newHazard });
    }
  };

  const handleSetBroadcastStage = (stage: 'DANGER' | 'NEAR_DANGER' | 'SAFE', broadcast = true) => {
    setBroadcastStage(stage);
    setAutoLoop(false);
    if (broadcast) {
      broadcastCrisisEvent({ type: 'BROADCAST_STAGE_CHANGED', payload: stage });
    }
  };

  // Page 4: Calamity Studio Actions
  const handleUpdateCalamityControls = async (updated: Partial<CalamitySimulationControls>) => {
    const newControls = { ...calamityControls, ...updated };
    setCalamityControls(newControls);

    const res = await crisisApi.calibrateSimulation(newControls);
    setTelemetry(res.updatedTelemetry);

    // Continuous dynamic reflection into Citizen Help Page
    if (
      newControls.riverGaugeMeters >= 7.5 ||
      newControls.riverDischargeCusecs >= 28000 ||
      newControls.inundationDepthFeet >= 3.5 ||
      newControls.windSpeedKmh >= 100
    ) {
      handleSetBroadcastStage('DANGER', true);
    } else if (
      newControls.riverGaugeMeters >= 6.0 ||
      newControls.riverDischargeCusecs >= 18000 ||
      newControls.inundationDepthFeet >= 1.2 ||
      newControls.windSpeedKmh >= 60
    ) {
      handleSetBroadcastStage('NEAR_DANGER', true);
    } else {
      handleSetBroadcastStage('SAFE', true);
    }
  };

  const handleResetSimulation = async () => {
    const resetControls: CalamitySimulationControls = {
      riverDischargeCusecs: 12000,
      riverGaugeMeters: 5.2,
      mordhanaDamDischargeCusecs: 2500,
      windSpeedKmh: 20,
      rainfallMmPerHour: 25,
      inundationDepthFeet: 0.5,
      powerGridActive: true,
      sirenActive: false,
      activeCalamity: 'FLOOD',
    };
    setCalamityControls(resetControls);
    const res = await crisisApi.calibrateSimulation(resetControls);
    setTelemetry(res.updatedTelemetry);
    handleSetBroadcastStage('SAFE', true);
  };

  const handleTriggerSiren = () => {
    setCalamityControls((prev) => ({ ...prev, sirenActive: true }));
    setTimeout(() => {
      setCalamityControls((prev) => ({ ...prev, sirenActive: false }));
    }, 4500);
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
      osc.frequency.linearRampToValueAtTime(800, now + 0.8);
      osc.frequency.linearRampToValueAtTime(1200, now + 1.2);
      osc.frequency.linearRampToValueAtTime(800, now + 1.6);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 2.0);
    } catch {
      // Audio context fallback
    }
  };

  // NDRF Command Actions (Page 2) -> Pushes to Field Missions (Page 3)
  const handleDispatchUnit = (id: string, unitName: string, broadcast = true) => {
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

    const targetReq = sosRequests.find((r) => r.id === id);
    const newMission: FieldMission = {
      id: `mis-${Date.now()}`,
      sosId: id,
      responderId: 'vol-1',
      responderName: unitName,
      responderType: unitName.includes('Boat') ? 'NDRF_BOAT' : 'AAPDA_MITRA',
      status: 'ASSIGNED',
      targetLocation: targetReq?.location || [12.9320, 79.1120],
      targetLandmark: targetReq?.landmark || 'Palar Basin',
      trappedCount: targetReq?.trappedCount || 3,
      priorityLevel: targetReq?.priorityLevel || 'P1_CRITICAL',
      waterLevel: targetReq?.waterLevel || 'WAIST_DEPTH',
      medicalUrgency: targetReq?.medicalEmergency || false,
      destinationShelterId: 'shelter-1',
      assignedAt: 'Just now',
      lastUpdateTimestamp: 'Just now',
    };

    setMissions((prev) => [newMission, ...prev]);

    if (broadcast) {
      broadcastCrisisEvent({
        type: 'UNIT_DISPATCHED',
        payload: { sosId: id, unitName, mission: newMission },
      });
    }
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

  // Field Responder Actions (Page 3)
  const handleUpdateMissionStatus = (
    missionId: string,
    sosId: string,
    status: FieldMission['status'],
    shelterId?: string,
    broadcast = true
  ) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status, lastUpdateTimestamp: 'Just now' } : m))
    );

    if (status === 'ARRIVED_SHELTER') {
      handleMarkRescued(sosId);

      // Increment shelter occupancy
      const targetReq = sosRequests.find((r) => r.id === sosId);
      const victimCount = targetReq?.trappedCount || 2;
      const targetShelterId = shelterId || 'shelter-1';

      setShelters((prev) =>
        prev.map((s) =>
          s.id === targetShelterId
            ? { ...s, capacityOccupied: Math.min(s.capacityOccupied + victimCount, s.capacityTotal) }
            : s
        )
      );
    }

    if (broadcast) {
      broadcastCrisisEvent({
        type: 'MISSION_STATUS_UPDATED',
        payload: { missionId, status, sosId },
      });
    }
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
        (mode === 'CITIZEN_HELP' || mode === ('CITIZEN' as PageViewMode)) && citizenView === 'GUIDE'
          ? 'bg-transparent'
          : 'bg-slate-950'
      }`}
    >
      {/* 1. Tactical Navigation Bar */}
      <Navbar
        mode={mode}
        setMode={handleSetMode}
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

      {/* Multi-Hazard Extensibility Selector */}
      {!((mode === 'CITIZEN_HELP' || mode === ('CITIZEN' as PageViewMode)) && citizenView === 'GUIDE') && (
        <MultiHazardBar
          selectedHazard={selectedHazard}
          onSelectHazard={setSelectedHazard}
          lang={lang}
        />
      )}

      {/* Decision-Support Risk Formula Breakdown Widget */}
      {!((mode === 'CITIZEN_HELP' || mode === ('CITIZEN' as PageViewMode)) && citizenView === 'GUIDE') && (
        <RiskEngineWidget weights={telemetry.riskBreakdown} lang={lang} />
      )}

      {/* 2. Main Body: Switchable between the 4 Interconnected Pages */}

      {/* PAGE 1: CITIZEN HELP & EVACUATION PORTAL */}
      {(mode === 'CITIZEN_HELP' || mode === ('CITIZEN' as PageViewMode)) && (
        <main className="flex-1 flex flex-col relative">
          {/* Sub-toggle: Guide vs Map & Isolated Direct Link Actions */}
          <div className="bg-black/60 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
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

            <div className="flex items-center gap-2">
              {/* Family Safe Check-In Shortcut */}
              <button
                onClick={() => setIsReunionOpen(true)}
                className="text-xs bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
              >
                <Users size={12} />
                <span>{lang === 'en' ? 'Family Check-In' : lang === 'hi' ? 'परिवार चेक-इन' : 'குடும்ப பதிவு'}</span>
              </button>
            </div>
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
              calamityControls={calamityControls}
              telemetry={telemetry}
              activeHazardsCount={hazards.filter((h) => h.status === 'AUTHORITY_VERIFIED').length}
            />
          ) : (
            /* View B: The Interactive Safe Evacuation Map */
            <div className="flex-1 flex flex-col relative">
              <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => setCitizenView('GUIDE')}
                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  <span>{lang === 'en' ? 'Back to Simple Guide' : '← வழிகாட்டிக்கு திரும்பு'}</span>
                </button>
                <span className="text-slate-400">
                  {lang === 'en' ? 'Showing Safe Elevated Bypass Route' : 'மேடான மாற்று வழி காட்டப்படுகிறது'}
                </span>
              </div>

              <InteractiveMap
                shelters={shelters}
                hazards={hazards}
                sosRequests={sosRequests}
                selectedShelter={selectedShelter}
                onSelectShelter={(shelter) => {
                  setSelectedShelter(shelter);
                  setDrawerTab('SHELTERS');
                }}
                lang={lang}
              />

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
      )}

      {/* PAGE 2: DEOC & DISTRICT COLLECTORATE COMMAND CENTER */}
      {mode === 'COMMAND_CENTER' && (
        <main className="flex-1 flex flex-col">
          <NDRFCommandCenter
            sosRequests={sosRequests}
            shelters={shelters}
            hazards={hazards}
            onDispatchUnit={handleDispatchUnit}
            onMarkRescued={handleMarkRescued}
            onVerifyHazard={handleVerifyHazard}
            broadcastStage={broadcastStage}
            onSetBroadcastStage={(st) => handleSetBroadcastStage(st, true)}
            autoLoop={autoLoop}
            onToggleAutoLoop={() => setAutoLoop(!autoLoop)}
            lang={lang}
          />
        </main>
      )}

      {/* PAGE 3: NDRF FIELD RESPONDER & VOLUNTEER DESK */}
      {mode === 'FIELD_RESPONDER' && (
        <main className="flex-1 flex flex-col">
          <FieldPersonnelPortal
            missions={missions}
            sosRequests={sosRequests}
            shelters={shelters}
            onUpdateMissionStatus={handleUpdateMissionStatus}
            onReportFieldHazard={handleNewHazard}
            lang={lang}
          />
        </main>
      )}

      {/* PAGE 4: LIVE CALAMITY STUDIO & TELEMETRY CONTROL ROOM */}
      {mode === 'CALAMITY_STUDIO' && (
        <main className="flex-1 flex flex-col">
          <CalamityStudio
            controls={calamityControls}
            telemetry={telemetry}
            onUpdateControls={handleUpdateCalamityControls}
            onInjectHazard={handleNewHazard}
            onResetSimulation={handleResetSimulation}
            onTriggerSiren={handleTriggerSiren}
            onSetBroadcastStage={(st) => handleSetBroadcastStage(st, true)}
            currentBroadcastStage={broadcastStage}
            autoLoop={autoLoop}
            onToggleAutoLoop={() => setAutoLoop(!autoLoop)}
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
          mode === 'CITIZEN_HELP' && citizenView === 'GUIDE'
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
