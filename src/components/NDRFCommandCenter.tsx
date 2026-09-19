import React, { useState } from 'react';
import {
  LifeBuoy,
  Phone,
  Clock,
  CheckCircle2,
  Anchor,
  Shield,
  Home,
  Check,
  MapPin,
  Zap,
} from 'lucide-react';
import type { SOSRequest, Shelter, HazardIncident, Language } from '../types/disaster';
import { sortSOSByUrgency } from '../utils/triage';

interface NDRFCommandCenterProps {
  sosRequests: SOSRequest[];
  shelters: Shelter[];
  hazards: HazardIncident[];
  onDispatchUnit: (id: string, unitName: string) => void;
  onMarkRescued: (id: string) => void;
  onVerifyHazard: (id: string) => void;
  broadcastStage: 'DANGER' | 'NEAR_DANGER' | 'SAFE';
  onSetBroadcastStage: (stage: 'DANGER' | 'NEAR_DANGER' | 'SAFE') => void;
  autoLoop: boolean;
  onToggleAutoLoop: () => void;
  onViewCitizenScreen: () => void;
  lang: Language;
}

export const NDRFCommandCenter: React.FC<NDRFCommandCenterProps> = ({
  sosRequests,
  shelters,
  hazards,
  onDispatchUnit,
  onMarkRescued,
  onVerifyHazard,
  broadcastStage,
  onSetBroadcastStage,
  autoLoop,
  onToggleAutoLoop,
  onViewCitizenScreen,
  lang: _lang,
}) => {
  const sortedRequests = sortSOSByUrgency(sosRequests);

  // Dynamic status-filtered lists
  const pendingRequests = sortedRequests.filter((r) => r.status === 'WAITING_DISPATCH');
  const enRouteRequests = sortedRequests.filter((r) => r.status === 'RESCUE_BOAT_DISPATCHED');
  const rescuedRequests = sortedRequests.filter((r) => r.status === 'RESCUED');

  const pendingCriticalCount = pendingRequests.filter(
    (r) => r.priorityLevel === 'P1_CRITICAL'
  ).length;

  const totalBoatsDeployed = 4 + enRouteRequests.length;
  const totalRescuedCount = rescuedRequests.reduce((sum, r) => sum + r.trappedCount, 0);

  // Live tactical dispatch log
  const [lastAction, setLastAction] = useState<string>(
    '4 NDRF Zodiac Teams active on Palar River patrol • Monitoring Katpadi & Kangeyanallur'
  );
  const [actionTimestamp, setActionTimestamp] = useState<string>('LIVE COMMAND');
  const [lastDispatchedId, setLastDispatchedId] = useState<string | null>(null);

  // Web Audio Tactical Chirp for instant auditory feedback
  const playTacticalChirp = (freq = 880) => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio fallback
    }
  };

  const handleDispatch = (req: SOSRequest) => {
    playTacticalChirp(960);
    const unitName = `NDRF Zodiac Unit #${enRouteRequests.length + 5} (Arakkonam Base)`;
    onDispatchUnit(req.id, unitName);
    setLastDispatchedId(req.id);
    setTimeout(() => setLastDispatchedId(null), 3000);
    setLastAction(`⚡ ${unitName} DISPATCHED to ${req.landmark} (${req.trappedCount} persons stranded)`);
    setActionTimestamp(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  const handleRescue = (req: SOSRequest) => {
    playTacticalChirp(1200);
    onMarkRescued(req.id);
    setLastAction(`🟢 RESCUE CONFIRMED: ${req.trappedCount} persons at ${req.landmark} safely evacuated to relief camp`);
    setActionTimestamp(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  const handleVerify = (h: HazardIncident) => {
    playTacticalChirp(1040);
    onVerifyHazard(h.id);
    setLastAction(`🛡️ ROAD CLOSURE VERIFIED: ${h.roadName} marked impassable on official citizen maps`);
    setActionTimestamp(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  const handleStageBroadcast = (stage: 'DANGER' | 'NEAR_DANGER' | 'SAFE', code: string) => {
    onSetBroadcastStage(stage);
    setLastAction(`📡 ADVISORY BROADCAST UPDATED: Broadcasted ${code} to all citizen mobile screens in Katpadi`);
    setActionTimestamp(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6 overflow-y-auto">
      {/* ============================================================ */}
      {/* 🎖️ TOP TACTICAL COMMAND HEADER (REACTIVE & DYNAMIC)          */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-blue-900/70 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded-full bg-blue-500 animate-ping"></span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                <span>NDRF 4th BATTALION & VELLORE DEOC COMMAND DESK</span>
              </h2>
            </div>
            <p className="text-xs text-blue-300 mt-1">
              Tactical Incident Command Center | Palar River Flash Flood Response Protocol
            </p>
          </div>

          {/* Quick Metrics Bar - REACTIVE COUNTERS */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Metric 1: Pending Critical */}
            <div className="bg-red-950/70 border border-red-700/80 px-3 py-1.5 rounded-xl text-center shadow transition-all">
              <span className="text-[10px] text-red-300 block font-bold">P1 CRITICAL</span>
              <span className="text-lg font-black text-red-400 font-mono">
                {pendingCriticalCount} PENDING
              </span>
            </div>

            {/* Metric 2: Rescue Boats Deployed */}
            <div
              className={`border px-3 py-1.5 rounded-xl text-center shadow transition-all ${
                enRouteRequests.length > 0
                  ? 'bg-blue-900/80 border-blue-400 ring-2 ring-blue-400/50 animate-pulse'
                  : 'bg-blue-950/70 border-blue-700/80'
              }`}
            >
              <span className="text-[10px] text-blue-300 block font-bold">RESCUE BOATS</span>
              <span className="text-lg font-black text-blue-300 font-mono">
                {totalBoatsDeployed} DEPLOYED
              </span>
            </div>

            {/* Metric 3: Active En Route Rescues */}
            <div className="bg-cyan-950/70 border border-cyan-700/80 px-3 py-1.5 rounded-xl text-center shadow">
              <span className="text-[10px] text-cyan-300 block font-bold">EN ROUTE</span>
              <span className="text-lg font-black text-cyan-400 font-mono">
                {enRouteRequests.length} ACTIVE
              </span>
            </div>

            {/* Metric 4: Citizens Saved */}
            <div className="bg-emerald-950/70 border border-emerald-700/80 px-3 py-1.5 rounded-xl text-center shadow">
              <span className="text-[10px] text-emerald-300 block font-bold">CITIZENS SAVED</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {totalRescuedCount} RESCUED
              </span>
            </div>

            {/* Metric 5: Shelters Open */}
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-center shadow hidden lg:block">
              <span className="text-[10px] text-slate-300 block font-bold">SHELTERS OPEN</span>
              <span className="text-lg font-black text-slate-200 font-mono">
                {shelters.length} CAMPS
              </span>
            </div>
          </div>
        </div>

        {/* ⚡ LIVE DYNAMIC COMMAND ACTION TICKER (Updates on every dispatch/rescue/verify) */}
        <div className="bg-slate-950/90 border border-blue-800/60 rounded-xl p-2.5 px-3.5 flex items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-ping"></span>
            <span className="text-blue-400 font-mono text-[10px] sm:text-[11px] font-bold uppercase shrink-0 flex items-center gap-1">
              <Zap size={13} className="text-blue-400" />
              <span>LIVE COMMAND ACTION:</span>
            </span>
            <span className="font-bold text-slate-100 text-xs truncate">
              {lastAction}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-300 bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded shrink-0">
            {actionTimestamp}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📡 MASTER CITIZEN BROADCAST CONTROLLER                        */}
      {/* ============================================================ */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <h3 className="font-extrabold text-sm text-white tracking-wide uppercase">
                EMERGENCY THREAT CONTROLLER & CITIZEN VIDEO FEED OVERRIDE
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Selects the official calamity video loop and survival advisory broadcasted to all citizens in Katpadi / Palar River Basin
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAutoLoop}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition ${
                autoLoop
                  ? 'bg-blue-600 border-blue-400 text-white animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              {autoLoop ? '⏹️ STOP AUTO LOOP' : '▶️ AUTO LOOP (6s)'}
            </button>

            <button
              onClick={onViewCitizenScreen}
              className="text-xs bg-blue-950 hover:bg-blue-900 border border-blue-600 text-blue-300 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 shadow"
            >
              <span>👁️ View Citizen Screen</span>
            </button>
          </div>
        </div>

        {/* 3 Master Stage Broadcast Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Option 1: d (Full Danger) */}
          <button
            onClick={() => handleStageBroadcast('DANGER', 'd.mp4 (Level 3 Danger)')}
            className={`p-3.5 rounded-xl border-2 text-left transition-all ${
              broadcastStage === 'DANGER'
                ? 'border-red-500 bg-red-950/90 shadow-xl shadow-red-950 ring-2 ring-red-500/40'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700 opacity-65 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="bg-red-600 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded shadow">
                BROADCAST: d.mp4
              </span>
              {broadcastStage === 'DANGER' && (
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest animate-pulse">
                  ● ACTIVE ON PHONES
                </span>
              )}
            </div>
            <div className="mt-2">
              <b className="text-sm text-red-300 block font-black">🔴 FULL DANGER ZONE</b>
              <span className="text-xs text-slate-300 block mt-0.5">
                Surge 4.8ft • Triggers Evacuation on Citizen screens
              </span>
            </div>
          </button>

          {/* Option 2: nd (Nearby Danger) */}
          <button
            onClick={() => handleStageBroadcast('NEAR_DANGER', 'nd.mp4 (Level 2 Watch)')}
            className={`p-3.5 rounded-xl border-2 text-left transition-all ${
              broadcastStage === 'NEAR_DANGER'
                ? 'border-amber-500 bg-amber-950/90 shadow-xl shadow-amber-950 ring-2 ring-amber-500/40'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700 opacity-65 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="bg-amber-600 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded shadow">
                BROADCAST: nd.mp4
              </span>
              {broadcastStage === 'NEAR_DANGER' && (
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest animate-pulse">
                  ● ACTIVE ON PHONES
                </span>
              )}
            </div>
            <div className="mt-2">
              <b className="text-sm text-amber-300 block font-black">🟠 NEARBY DANGER (WATCH)</b>
              <span className="text-xs text-slate-300 block mt-0.5">
                Water within 400m • Triggers Pack & Prepare mode
              </span>
            </div>
          </button>

          {/* Option 3: s (Safe Zone) */}
          <button
            onClick={() => handleStageBroadcast('SAFE', 's.mp4 (Level 1 Safe)')}
            className={`p-3.5 rounded-xl border-2 text-left transition-all ${
              broadcastStage === 'SAFE'
                ? 'border-emerald-500 bg-emerald-950/90 shadow-xl shadow-emerald-950 ring-2 ring-emerald-500/40'
                : 'border-slate-800 bg-slate-950 hover:border-slate-700 opacity-65 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="bg-emerald-600 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded shadow">
                BROADCAST: s.mp4
              </span>
              {broadcastStage === 'SAFE' && (
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">
                  ● ACTIVE ON PHONES
                </span>
              )}
            </div>
            <div className="mt-2">
              <b className="text-sm text-emerald-300 block font-black">🟢 SAFE / ALL CLEAR</b>
              <span className="text-xs text-slate-300 block mt-0.5">
                Directs citizens to VIT Stadium Relief Camp
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 📋 MAIN GRID: TRIAGE QUEUE & SHELTERS / HAZARDS             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Live Triage Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LifeBuoy className="text-red-400" size={20} />
              <h3 className="font-extrabold text-base text-white">
                LIVE TRIAGE PRIORITY DISPATCH QUEUE
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Sorted by Urgency Score ↓
            </span>
          </div>

          <div className="space-y-3">
            {sortedRequests.map((req) => {
              const isRescued = req.status === 'RESCUED';
              const isDispatched = req.status === 'RESCUE_BOAT_DISPATCHED';
              const isJustDispatched = lastDispatchedId === req.id;

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isRescued
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : isJustDispatched
                      ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-400 animate-pulse'
                      : isDispatched
                      ? 'bg-blue-950/20 border-blue-800/80'
                      : req.priorityLevel === 'P1_CRITICAL'
                      ? 'bg-red-950/20 border-red-800/80 ring-1 ring-red-600/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      {/* Urgency Score Badge */}
                      <div
                        className={`h-12 w-12 rounded-xl flex flex-col items-center justify-center font-mono font-black ${
                          isRescued
                            ? 'bg-slate-800 text-slate-400'
                            : req.urgencyScore >= 80
                            ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        <span className="text-base leading-none">{req.urgencyScore}</span>
                        <span className="text-[9px] font-bold">/100</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-white">
                            {req.citizenName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              req.priorityLevel === 'P1_CRITICAL'
                                ? 'bg-red-600/30 text-red-300 border border-red-600'
                                : 'bg-amber-600/30 text-amber-300 border border-amber-600'
                            }`}
                          >
                            {req.priorityLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-slate-300">{req.phone}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {req.timestamp}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow ${
                          isRescued
                            ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                            : isDispatched
                            ? 'bg-blue-950 border border-blue-400 text-blue-300 animate-pulse'
                            : 'bg-amber-950 border border-amber-500 text-amber-300'
                        }`}
                      >
                        {isRescued && <CheckCircle2 size={13} />}
                        {isDispatched && <Anchor size={13} className="animate-spin-slow" />}
                        <span>
                          {isRescued
                            ? 'RESCUED & SAFE'
                            : isDispatched
                            ? 'BOAT EN ROUTE'
                            : 'PENDING BOAT DISPATCH'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="py-3 text-xs space-y-2">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <MapPin size={14} className="text-red-400 shrink-0 mt-0.5" />
                      <span>
                        <b>Location:</b> {req.landmark}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                        👥 {req.trappedCount} Trapped
                      </span>
                      {req.hasInfants && (
                        <span className="bg-pink-950 border border-pink-700 text-pink-300 px-2 py-0.5 rounded text-[11px] font-bold">
                          🍼 Infant / Child
                        </span>
                      )}
                      {req.hasElderlyOrDisabled && (
                        <span className="bg-amber-950 border border-amber-700 text-amber-300 px-2 py-0.5 rounded text-[11px] font-bold">
                          🧓 Elderly / Disabled
                        </span>
                      )}
                      {req.medicalEmergency && (
                        <span className="bg-red-950 border border-red-700 text-red-300 px-2 py-0.5 rounded text-[11px] font-bold">
                          🚨 Critical Medical
                        </span>
                      )}
                      <span className="bg-blue-950 border border-blue-700 text-blue-300 px-2 py-0.5 rounded text-[11px]">
                        🌊 {req.waterLevel.replace('_', ' ')}
                      </span>
                    </div>

                    {req.medicalDetails && (
                      <p className="text-red-300 bg-red-950/40 p-2 rounded-lg border border-red-900/60 font-mono text-[11px]">
                        <b>Medical Note:</b> {req.medicalDetails}
                      </p>
                    )}

                    {req.dispatchedUnit && (
                      <div className="bg-blue-950/60 border border-blue-800/80 rounded-lg p-2 flex items-center gap-2 text-blue-300 font-semibold text-[11px]">
                        <Anchor size={14} className="text-blue-400 animate-spin-slow" />
                        <span>
                          Assigned: <b>{req.dispatchedUnit}</b> (En Route via Palar River bypass)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                    {!isRescued && !isDispatched && (
                      <button
                        onClick={() => handleDispatch(req)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow active:scale-95"
                      >
                        <Anchor size={13} />
                        <span>DISPATCH NDRF RESCUE BOAT</span>
                      </button>
                    )}

                    {!isRescued && (
                      <button
                        onClick={() => handleRescue(req)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow active:scale-95 ${
                          isDispatched
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span>CONFIRM RESCUED</span>
                      </button>
                    )}

                    <a
                      href={`tel:${req.phone}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Phone size={13} />
                      <span>Call Citizen</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Shelters Status & Hazard Verification */}
        <div className="space-y-6">
          {/* Shelters Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Home size={16} className="text-emerald-400" />
              <span>SHELTER CAPACITY & AMENITIES</span>
            </div>

            <div className="space-y-3">
              {shelters.map((s) => {
                const freeBeds = Math.max(0, s.capacityTotal - s.capacityOccupied);
                const occupancyPercent = Math.min(
                  100,
                  Math.round((s.capacityOccupied / s.capacityTotal) * 100)
                );

                return (
                  <div
                    key={s.id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <b className="text-white font-bold">{s.name}</b>
                      <span className="font-mono text-emerald-400 font-black">
                        {freeBeds} FREE BEDS
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${occupancyPercent}%` }}
                      ></div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1 text-[10px] text-slate-300">
                      {s.amenities.medicalAid && (
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          💊 Medical
                        </span>
                      )}
                      {s.amenities.solarPower && (
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          ⚡ Solar
                        </span>
                      )}
                      {s.amenities.drinkingWater && (
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          💧 Clean Water
                        </span>
                      )}
                      {s.amenities.communityKitchen && (
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          🍲 Hot Food
                        </span>
                      )}
                      {s.amenities.babyFood && (
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          🍼 Baby Food
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Crowd Hazard Verification Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Shield size={16} className="text-amber-400" />
                <span>HAZARD REPORTS DESK</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {hazards.length} Incidents Logged
              </span>
            </div>

            <div className="space-y-2.5">
              {hazards.map((h) => (
                <div
                  key={h.id}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <b className="text-amber-300 font-bold">{h.type.replace('_', ' ')}</b>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        h.status === 'AUTHORITY_VERIFIED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {h.status === 'AUTHORITY_VERIFIED' ? 'VERIFIED' : 'UNCONFIRMED'}
                    </span>
                  </div>
                  <p className="text-slate-400">{h.roadName}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">{h.reportedBy}</span>
                    {h.status !== 'AUTHORITY_VERIFIED' && (
                      <button
                        onClick={() => handleVerify(h)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1 transition shadow active:scale-95"
                      >
                        <Check size={12} /> Verify
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
