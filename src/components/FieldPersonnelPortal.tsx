import React, { useState } from 'react';
import {
  Ship,
  Phone,
  MapPin,
  LifeBuoy,
  Users,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Compass,
} from 'lucide-react';
import type {
  FieldMission,
  SOSRequest,
  Shelter,
  HazardIncident,
  Language,
} from '../types/disaster';

interface FieldPersonnelPortalProps {
  missions: FieldMission[];
  sosRequests: SOSRequest[];
  shelters: Shelter[];
  onUpdateMissionStatus: (
    missionId: string,
    sosId: string,
    status: FieldMission['status'],
    shelterId?: string
  ) => void;
  onReportFieldHazard: (hazard: HazardIncident) => void;
  lang: Language;
}

export const FieldPersonnelPortal: React.FC<FieldPersonnelPortalProps> = ({
  missions,
  sosRequests,
  shelters,
  onUpdateMissionStatus,
  onReportFieldHazard,
  lang: _lang,
}) => {
  const [activeUnit, setActiveUnit] = useState<string>('vol-1');
  const [dutyStatus, setDutyStatus] = useState<'DEPLOYED' | 'STANDBY' | 'RETURNING'>('DEPLOYED');
  const [selectedShelterId, setSelectedShelterId] = useState<string>(shelters[0]?.id || 'shelter-1');

  // Responder Profiles
  const responders = [
    {
      id: 'vol-1',
      name: 'Capt. Arul Prakash',
      role: 'NDRF Inflatable Motor Boat #3 (60HP)',
      skill: 'SWIFT WATER RESCUE PILOT',
      callsign: 'RESCUE-BRAVO-02',
      assignedSector: 'Palar River Basin / Kangeyanallur Causeway',
    },
    {
      id: 'vol-2',
      name: 'Dr. Meena Swaminathan',
      role: 'Rapid Medical Mobile Unit #1',
      skill: 'TRAUMA MEDIC / PARAMEDIC',
      callsign: 'MEDIC-ALPHA-01',
      assignedSector: 'Shenbakkam Lowlands Emergency Post',
    },
    {
      id: 'vol-4',
      name: 'Karthik Raja',
      role: 'Thermal Inundation Drone #02',
      skill: 'RECON DRONE OPERATOR',
      callsign: 'RECON-EAGLE-04',
      assignedSector: 'Katpadi Railway Underpass Corridor',
    },
  ];

  const currentResponder = responders.find((r) => r.id === activeUnit) || responders[0];

  // Derive active tasks: missions assigned or pending high-priority SOS
  const activeMissions = missions.filter((m) => m.status !== 'COMPLETED');
  const pendingRequests = sosRequests.filter((r) => r.status === 'RESCUE_BOAT_DISPATCHED' || r.status === 'WAITING_DISPATCH');

  const handleStepStatus = (missionId: string, sosId: string, nextStatus: FieldMission['status']) => {
    onUpdateMissionStatus(missionId, sosId, nextStatus, selectedShelterId);
  };

  const handleQuickFieldObstacle = () => {
    onReportFieldHazard({
      id: `haz-field-${Date.now()}`,
      type: 'FALLEN_TREE',
      title: 'Floating debris blocking boat propulsion path near Kangeyanallur',
      hindiTitle: 'कांगेयनल्लूर में तैरता मलबा मार्ग अवरुद्ध कर रहा है',
      tamilTitle: 'காங்கேயநல்லூர் ஆற்றுப்பகுதியில் படகு பாதை அடைப்பு',
      location: [12.9460, 79.1350],
      roadName: 'Palar River Main Channel',
      status: 'AUTHORITY_VERIFIED',
      upvotes: 18,
      reportedAt: 'Just now',
      reportedBy: currentResponder.name,
    });
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 overflow-y-auto">
      {/* Top Field Operations Header */}
      <div className="bg-slate-900 border border-blue-900/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-950 px-2.5 py-0.5 rounded border border-blue-800">
                TACTICAL FIELD DESK (PAGE 3)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Ship className="text-blue-400" size={24} />
              <span>NDRF 4th BATTALION & AAPDA MITRA FIELD PORTAL</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Field Responder mission execution, mobile rescue telemetry, survivor extraction tracking, and direct shelter intake.
            </p>
          </div>

          {/* Unit Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {responders.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveUnit(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeUnit === r.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                <span>{r.name.split(' ')[0]}</span>
                <span className="text-[10px] font-mono opacity-80">({r.callsign.split('-')[1]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Unit Status Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Active Unit:</span>
            <b className="text-white">{currentResponder.name}</b>
            <span className="text-blue-300 font-mono">[{currentResponder.role}]</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Duty State:</span>
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setDutyStatus('DEPLOYED')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
                  dutyStatus === 'DEPLOYED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                DEPLOYED
              </button>
              <button
                onClick={() => setDutyStatus('STANDBY')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
                  dutyStatus === 'STANDBY' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                STANDBY
              </button>
              <button
                onClick={() => setDutyStatus('RETURNING')}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition ${
                  dutyStatus === 'RETURNING' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                RETURNING
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
            <Compass size={14} className="text-emerald-400" />
            <span>GPS: 12.9320° N, 79.1120° E (Palar Bund)</span>
          </div>
        </div>
      </div>

      {/* Main Field Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Active Assigned Rescue Missions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy className="text-red-400" size={20} />
              <h3 className="font-extrabold text-base text-white">
                MY ACTIVE RESCUE MISSIONS & EVACUATION TICKETS
              </h3>
            </div>
            <span className="text-xs font-mono bg-red-950/80 text-red-300 px-2.5 py-1 rounded border border-red-800">
              {activeMissions.length || pendingRequests.length} ACTIVE IN FIELD
            </span>
          </div>

          {/* Missions List */}
          <div className="space-y-4">
            {pendingRequests.map((req, idx) => {
              const mission = activeMissions.find((m) => m.sosId === req.id);
              const status = mission?.status || (req.status === 'RESCUE_BOAT_DISPATCHED' ? 'EN_ROUTE' : 'ASSIGNED');

              return (
                <div
                  key={req.id}
                  className="bg-slate-900/90 border-2 border-red-600/70 rounded-2xl p-5 shadow-2xl space-y-4"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white uppercase tracking-wider font-mono">
                          {req.priorityLevel}
                        </span>
                        <h4 className="font-black text-lg text-white">
                          MISSION #{idx + 1}: {req.citizenName}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                        <MapPin size={13} className="text-red-400" />
                        <span>{req.landmark}</span>
                      </p>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-xs text-slate-400 block">TRIAGE SCORE</span>
                      <span className="text-xl font-black text-red-400">{req.urgencyScore}/100</span>
                    </div>
                  </div>

                  {/* Demographic & Threat Flags */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">PEOPLE TRAPPED</span>
                      <b className="text-white text-sm flex items-center gap-1">
                        <Users size={14} className="text-blue-400" />
                        <span>{req.trappedCount} Citizens</span>
                      </b>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">WATER LEVEL</span>
                      <b className="text-amber-400 text-sm">{req.waterLevel}</b>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">HIGH RISK VULNERABILITY</span>
                      <b className="text-white text-xs">
                        {req.hasInfants && '👶 Infant '}
                        {req.hasElderlyOrDisabled && '🧓 Elderly '}
                        {req.hasPregnantWomen && '🤰 Pregnant'}
                      </b>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">CONTACT PHONE</span>
                      <a href={`tel:${req.phone}`} className="text-blue-400 font-bold hover:underline flex items-center gap-1">
                        <Phone size={12} />
                        <span>{req.phone}</span>
                      </a>
                    </div>
                  </div>

                  {req.medicalDetails && (
                    <div className="bg-red-950/40 border border-red-700/60 p-3 rounded-xl text-xs text-red-200">
                      <b>⚠️ CRITICAL MEDICAL ALERT:</b> {req.medicalDetails}
                    </div>
                  )}

                  {/* 4-Step Action Progression Pipeline */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">Mission Execution Step:</span>
                      <span className="font-mono text-emerald-400 font-bold">STATUS: {status}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleStepStatus(mission?.id || `mis-${req.id}`, req.id, 'EN_ROUTE')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                          status === 'EN_ROUTE'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Navigation size={13} />
                        <span>1. EN ROUTE</span>
                      </button>

                      <button
                        onClick={() => handleStepStatus(mission?.id || `mis-${req.id}`, req.id, 'ON_SCENE')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                          status === 'ON_SCENE'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <MapPin size={13} />
                        <span>2. ON SCENE</span>
                      </button>

                      <button
                        onClick={() => handleStepStatus(mission?.id || `mis-${req.id}`, req.id, 'EXTRACTING')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                          status === 'EXTRACTING'
                            ? 'bg-rose-600 text-white shadow-lg'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <LifeBuoy size={13} />
                        <span>3. EXTRACTING</span>
                      </button>

                      <button
                        onClick={() => handleStepStatus(mission?.id || `mis-${req.id}`, req.id, 'ARRIVED_SHELTER')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                          status === 'ARRIVED_SHELTER'
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>4. SAFE AT SHELTER</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {pendingRequests.length === 0 && (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
                <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
                <h4 className="text-white font-bold">No Pending Evacuation Missions</h4>
                <p className="text-xs mt-1">All assigned disaster victims in this sector have been transferred to relief shelters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Field Utilities & Shelter Intake */}
        <div className="space-y-5">
          {/* Direct Shelter Drop-Off Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-emerald-400" />
              <span>Destination Shelter Intake</span>
            </h4>
            <p className="text-xs text-slate-300">
              Select destination camp for victim drop-off. Capacity updates across all views immediately:
            </p>

            <select
              value={selectedShelterId}
              onChange={(e) => setSelectedShelterId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
            >
              {shelters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.capacityTotal - s.capacityOccupied} beds free)
                </option>
              ))}
            </select>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block font-bold">Selected Shelter Status:</span>
              <div className="flex justify-between text-white font-bold">
                <span>Total Capacity:</span>
                <span>{shelters.find((s) => s.id === selectedShelterId)?.capacityTotal} beds</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Available Now:</span>
                <span>
                  {(shelters.find((s) => s.id === selectedShelterId)?.capacityTotal || 0) -
                    (shelters.find((s) => s.id === selectedShelterId)?.capacityOccupied || 0)}{' '}
                  free beds
                </span>
              </div>
            </div>
          </div>

          {/* Quick Field Hazard Report Button */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              <span>Field Obstacle Telemetry</span>
            </h4>
            <p className="text-xs text-slate-300">
              Spotted a new water obstruction or downed powerline while navigating the boat? Report immediately to update the safe route maps:
            </p>

            <button
              onClick={handleQuickFieldObstacle}
              className="w-full py-2.5 px-3 bg-amber-600/90 hover:bg-amber-500 text-white font-black rounded-xl text-xs shadow-lg shadow-amber-950 flex items-center justify-center gap-2 transition"
            >
              <AlertTriangle size={14} />
              <span>LOG OBSTACLE AT BOAT POSITION</span>
            </button>
          </div>

          {/* Equipment & Survival Checklist */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl text-xs">
            <h4 className="font-extrabold text-white uppercase tracking-wider">
              Field Boat Inventory (Standard NDRF Unit)
            </h4>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span>Adult Life Vests:</span>
                <b className="text-emerald-400">12 Packed</b>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span>Infant Life Preservers:</span>
                <b className="text-emerald-400">4 Packed</b>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span>Portable O2 Concentrator:</span>
                <b className="text-emerald-400">1 Active (100%)</b>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span>VHF Marine Radio:</span>
                <b className="text-blue-400">Channel 16 (DEOC)</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
