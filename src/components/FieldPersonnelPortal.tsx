import React, { useState } from 'react';
import {
  Ship,
  Navigation,
  CheckCircle2,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Home,
  Clock,
  Radio,
  PlusCircle,
  Zap,
} from 'lucide-react';
import type {
  SOSRequest,
  Shelter,
  HazardIncident,
  ResponderRole,
  MissionStage,
  Language,
} from '../types/disaster';
import { translations } from '../utils/translations';
import { CrisisAPI, broadcastCrisisEvent } from '../services/api';

interface FieldPersonnelPortalProps {
  sosRequests: SOSRequest[];
  shelters: Shelter[];
  onUpdateSOSStatus: (id: string, status: SOSRequest['status'], stage?: MissionStage) => void;
  onAddHazard: (hazard: HazardIncident) => void;
  onShelterIntake: (shelterId: string, count: number) => void;
  lang: Language;
}

const STAGES: { key: MissionStage; label: string; step: number }[] = [
  { key: 'ASSIGNED_EN_ROUTE', label: '1. En Route', step: 1 },
  { key: 'ON_SCENE', label: '2. On Scene', step: 2 },
  { key: 'EXTRACTING_VICTIMS', label: '3. Extracting', step: 3 },
  { key: 'SAFE_AT_SHELTER', label: '4. Safe at Shelter', step: 4 },
];

export const FieldPersonnelPortal: React.FC<FieldPersonnelPortalProps> = ({
  sosRequests,
  shelters,
  onUpdateSOSStatus,
  onAddHazard,
  onShelterIntake,
  lang,
}) => {
  const t = translations[lang] || translations.en;

  // Active Responder Identity
  const [selectedRole, setSelectedRole] = useState<ResponderRole>('NDRF_BOAT_PILOT');
  const [responderName, setResponderName] = useState('Sub-Inspector S. Murugan');
  const [unitCode, setUnitCode] = useState('NDRF-BOAT-04');

  // Mission Tracking State (maps SOS ID to mission stage)
  const [missionStages, setMissionStages] = useState<Record<string, MissionStage>>({
    'sos-1': 'ON_SCENE',
    'sos-2': 'ASSIGNED_EN_ROUTE',
  });

  // Rapid Field Hazard Injection State
  const [hazardTitle, setHazardTitle] = useState('');
  const [hazardType, setHazardType] = useState<HazardIncident['type']>('FLOOD_DEEP');
  const [hazardRoad, setHazardRoad] = useState('');
  const [hazardDepth, setHazardDepth] = useState('4.5');
  const [isSubmittingHazard, setIsSubmittingHazard] = useState(false);

  // Quick Shelter Intake State
  const [selectedShelterId, setSelectedShelterId] = useState(shelters[0]?.id || 'sh-1');
  const [intakeCount, setIntakeCount] = useState(4);
  const [intakeSuccess, setIntakeSuccess] = useState(false);

  // Filter missions relevant for responders
  const activeMissions = sosRequests.filter(
    (r) => r.status === 'RESCUE_BOAT_DISPATCHED' || missionStages[r.id]
  );

  const handleAdvanceStage = (sosId: string, currentStage: MissionStage) => {
    let nextStage: MissionStage = 'ON_SCENE';
    if (currentStage === 'ASSIGNED_EN_ROUTE') nextStage = 'ON_SCENE';
    else if (currentStage === 'ON_SCENE') nextStage = 'EXTRACTING_VICTIMS';
    else if (currentStage === 'EXTRACTING_VICTIMS') nextStage = 'SAFE_AT_SHELTER';
    else nextStage = 'SAFE_AT_SHELTER';

    setMissionStages((prev) => ({ ...prev, [sosId]: nextStage }));
    broadcastCrisisEvent('MISSION_STAGE_UPDATE', { sosId, stage: nextStage, unit: unitCode }, 'field_responder');

    if (nextStage === 'SAFE_AT_SHELTER') {
      onUpdateSOSStatus(sosId, 'RESCUED', nextStage);
    }
  };

  const handleInjectFieldHazard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hazardTitle || !hazardRoad) return;

    setIsSubmittingHazard(true);
    const newHazard: HazardIncident = {
      id: `haz-field-${Date.now()}`,
      type: hazardType,
      title: hazardTitle,
      hindiTitle: hazardTitle,
      tamilTitle: hazardTitle,
      location: [12.972 + (Math.random() - 0.5) * 0.02, 79.155 + (Math.random() - 0.5) * 0.02],
      roadName: hazardRoad,
      waterDepthFeet: parseFloat(hazardDepth) || 3.0,
      status: 'AUTHORITY_VERIFIED',
      upvotes: 12,
      reportedAt: 'Just now',
      reportedBy: `${unitCode} (${responderName})`,
    };

    onAddHazard(newHazard);
    CrisisAPI.reportHazard(newHazard);

    setHazardTitle('');
    setHazardRoad('');
    setIsSubmittingHazard(false);
  };

  const handlePerformShelterIntake = () => {
    if (!selectedShelterId || intakeCount <= 0) return;
    onShelterIntake(selectedShelterId, intakeCount);
    CrisisAPI.registerShelterIntake(selectedShelterId, intakeCount);
    setIntakeSuccess(true);
    setTimeout(() => setIntakeSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Tactical Responder Header & Role Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-bold">
                Field Operations Grid • VHF Ch-16 Connected
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Ship className="text-blue-400" />
              NDRF & Volunteer Action Terminal
            </h1>
            <p className="text-xs text-slate-400">
              Live responder dispatch execution, field hazard broadcasting, and shelter intake.
            </p>
          </div>

          {/* Role Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setSelectedRole('NDRF_BOAT_PILOT');
                setResponderName('Inspector S. Murugan');
                setUnitCode('NDRF-BOAT-04');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedRole === 'NDRF_BOAT_PILOT'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ship size={14} />
              NDRF Boat Pilot
            </button>
            <button
              onClick={() => {
                setSelectedRole('AAPDA_MITRA_VOLUNTEER');
                setResponderName('K. Anbarasan (Aapda Mitra)');
                setUnitCode('VOL-KATPADI-12');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedRole === 'AAPDA_MITRA_VOLUNTEER'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation size={14} />
              Aapda Mitra
            </button>
            <button
              onClick={() => {
                setSelectedRole('SDRF_PARAMEDIC');
                setResponderName('Dr. Kavitha (SDRF Medical)');
                setUnitCode('SDRF-MED-02');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedRole === 'SDRF_PARAMEDIC'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={14} />
              SDRF Paramedic
            </button>
          </div>
        </div>

        {/* Active Badge Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Active Unit: <strong className="text-white">{unitCode}</strong>
            </span>
            <span>
              Officer In-Charge: <strong className="text-white">{responderName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-blue-400 font-mono text-[11px]">
            <Radio size={12} className="animate-pulse" />
            Vellore Palar Basin Sector 3
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Left 2 Columns: Active Rescue Missions & 4-Stage Pipeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              Active Field Missions ({activeMissions.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Click arrow to advance operational pipeline
            </span>
          </div>

          {activeMissions.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
              <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
              <p className="text-white font-bold">All assigned missions cleared!</p>
              <p className="text-xs text-slate-400">
                Stand by on VHF Ch-16 or monitor DEOC Command for new priority extractions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeMissions.map((mission) => {
                const currentStage = missionStages[mission.id] || 'ASSIGNED_EN_ROUTE';
                const currentStepIdx = STAGES.findIndex((s) => s.key === currentStage);

                return (
                  <div
                    key={mission.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition shadow-xl"
                  >
                    {/* Mission Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-red-950 text-red-400 border border-red-800">
                            {mission.priorityLevel}
                          </span>
                          <h3 className="font-extrabold text-white text-base">
                            {mission.citizenName}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                          <MapPin size={12} className="text-blue-400" />
                          {mission.landmark} • {mission.trappedCount} People Trapped
                        </p>
                      </div>

                      {/* Advance Stage Button */}
                      <button
                        onClick={() => handleAdvanceStage(mission.id, currentStage)}
                        disabled={currentStage === 'SAFE_AT_SHELTER'}
                        className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 ${
                          currentStage === 'SAFE_AT_SHELTER'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        }`}
                      >
                        {currentStage === 'SAFE_AT_SHELTER' ? (
                          <>
                            <CheckCircle2 size={14} /> Rescued
                          </>
                        ) : (
                          <>
                            Next Stage <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>

                    {/* 4-Stage Stepper */}
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                      <div className="grid grid-cols-4 gap-1">
                        {STAGES.map((s, idx) => {
                          const isCompleted = idx <= currentStepIdx;
                          const isCurrent = idx === currentStepIdx;

                          return (
                            <div key={s.key} className="text-center space-y-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  isCurrent
                                    ? 'bg-blue-400 shadow-sm shadow-blue-400'
                                    : isCompleted
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-800'
                                }`}
                              />
                              <p
                                className={`text-[10px] font-mono truncate ${
                                  isCurrent
                                    ? 'text-white font-bold'
                                    : isCompleted
                                    ? 'text-emerald-400'
                                    : 'text-slate-500'
                                }`}
                              >
                                {s.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mission Details & Medical Alert */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-3">
                        {mission.medicalEmergency && (
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <AlertTriangle size={12} /> Medical Support Required
                          </span>
                        )}
                        <span>Water Level: <b>{mission.waterLevel}</b></span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">{mission.phone}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Right Column: Rapid Field Hazard Injection & Shelter Intake */}
        <div className="space-y-6">
          {/* Rapid Field Hazard Injection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                Rapid Field Hazard Injection
              </h3>
              <span className="text-[10px] bg-amber-950 border border-amber-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                Live Broadcast
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Encountered a submerged culvert or live wire? Broadcast instantly to reroute rescue units.
            </p>

            <form onSubmit={handleInjectFieldHazard} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Obstruction Type</label>
                <select
                  value={hazardType}
                  onChange={(e) => setHazardType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="FLOOD_DEEP">Severe Flash Flood / Submerged Road</option>
                  <option value="LIVE_WIRE">Downed High-Voltage Live Wire</option>
                  <option value="BRIDGE_CLOSED">Bridge Submerged / Structurally Unsafe</option>
                  <option value="FALLEN_TREE">Fallen Tree Blocking Emergency Lane</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Location / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Katpadi Railway Underpass"
                  value={hazardTitle}
                  onChange={(e) => setHazardTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Road Name</label>
                  <input
                    type="text"
                    placeholder="e.g. NH-75 Katpadi Road"
                    value={hazardRoad}
                    onChange={(e) => setHazardRoad(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Water Depth (ft)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hazardDepth}
                    onChange={(e) => setHazardDepth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingHazard}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-2.5 rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-1.5"
              >
                <PlusCircle size={14} />
                Broadcast Hazard to Network
              </button>
            </form>
          </div>

          {/* Quick Shelter Intake */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Home size={16} className="text-blue-400" />
                Shelter Intake Registration
              </h3>
              <span className="text-[10px] bg-blue-950 border border-blue-800 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                Bed Capacity
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Dropped off rescued victims at a shelter? Log headcount to update live available capacity.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Relief Shelter</label>
                <select
                  value={selectedShelterId}
                  onChange={(e) => setSelectedShelterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {shelters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.capacityTotal - s.capacityOccupied} beds free)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Rescued People Admitted
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={intakeCount}
                    onChange={(e) => setIntakeCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handlePerformShelterIntake}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition whitespace-nowrap"
                  >
                    Confirm Intake
                  </button>
                </div>
              </div>

              {intakeSuccess && (
                <div className="p-2.5 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl text-center font-bold animate-fade-in flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={14} /> Intake logged & broadcasted!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
