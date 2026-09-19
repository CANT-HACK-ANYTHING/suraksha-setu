import React, { useState } from 'react';
import {
  Sliders,
  Waves,
  Wind,
  Gauge,
  Zap,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  Radio,
  PlusCircle,
  Activity,
} from 'lucide-react';
import type { CalamityDials, HazardIncident, Language } from '../types/disaster';
import { CrisisAPI, broadcastCrisisEvent } from '../services/api';

interface CalamityStudioProps {
  currentDials: CalamityDials;
  onUpdateDials: (dials: CalamityDials) => void;
  onAddHazard: (hazard: HazardIncident) => void;
  lang: Language;
}

export const CalamityStudio: React.FC<CalamityStudioProps> = ({
  currentDials,
  onUpdateDials,
  onAddHazard,
}) => {
  const [dials, setDials] = useState<CalamityDials>(currentDials);
  const [broadcastActive, setBroadcastActive] = useState(false);

  // Quick Spawner Form State
  const [spawnTitle, setSpawnTitle] = useState('');
  const [spawnType, setSpawnType] = useState<HazardIncident['type']>('FLOOD_DEEP');

  // Sync dials change to parent and broadcast to crisis event mesh
  const updateDial = <K extends keyof CalamityDials>(key: K, value: CalamityDials[K]) => {
    const updated = { ...dials, [key]: value };
    setDials(updated);
    onUpdateDials(updated);
    CrisisAPI.broadcastCalamityDials(updated);

    setBroadcastActive(true);
    setTimeout(() => setBroadcastActive(false), 1200);
  };

  // Disaster Presets
  const applyPreset = (presetName: string) => {
    let preset: CalamityDials;

    switch (presetName) {
      case 'FLASH_FLOOD':
        preset = {
          palarDischargeCusecs: 48000,
          riverGaugeMeters: 8.8,
          mordhanaDamCusecs: 22000,
          cycloneWindKmh: 45,
          streetInundationFeet: 4.8,
          gridPowerOutage: true,
        };
        break;
      case 'CYCLONE':
        preset = {
          palarDischargeCusecs: 35000,
          riverGaugeMeters: 7.6,
          mordhanaDamCusecs: 15000,
          cycloneWindKmh: 140,
          streetInundationFeet: 3.2,
          gridPowerOutage: true,
        };
        break;
      case 'DAM_BURST':
        preset = {
          palarDischargeCusecs: 58000,
          riverGaugeMeters: 9.9,
          mordhanaDamCusecs: 29000,
          cycloneWindKmh: 20,
          streetInundationFeet: 6.2,
          gridPowerOutage: true,
        };
        break;
      default: // BASELINE
        preset = {
          palarDischargeCusecs: 8500,
          riverGaugeMeters: 4.2,
          mordhanaDamCusecs: 3000,
          cycloneWindKmh: 18,
          streetInundationFeet: 0.5,
          gridPowerOutage: false,
        };
        break;
    }

    setDials(preset);
    onUpdateDials(preset);
    CrisisAPI.broadcastCalamityDials(preset);

    // Also update broadcast threat state
    if (preset.riverGaugeMeters >= 7.5 || preset.streetInundationFeet >= 4.0) {
      CrisisAPI.broadcastStageOverride('DANGER');
    } else if (preset.riverGaugeMeters >= 6.0) {
      CrisisAPI.broadcastStageOverride('NEAR_DANGER');
    } else {
      CrisisAPI.broadcastStageOverride('SAFE');
    }
  };

  const handleSpawnHazard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spawnTitle) return;

    const newHazard: HazardIncident = {
      id: `haz-sim-${Date.now()}`,
      type: spawnType,
      title: spawnTitle,
      hindiTitle: spawnTitle,
      tamilTitle: spawnTitle,
      location: [12.955 + (Math.random() - 0.5) * 0.03, 79.145 + (Math.random() - 0.5) * 0.03],
      roadName: 'Vellore Basin Emergency Sector',
      waterDepthFeet: dials.streetInundationFeet,
      status: 'COMMUNITY_CONFIRMED',
      upvotes: 18,
      reportedAt: 'Simulated Just Now',
      reportedBy: 'Calamity Simulation Desk',
    };

    onAddHazard(newHazard);
    CrisisAPI.reportHazard(newHazard);
    setSpawnTitle('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Header with Active Mesh Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  broadcastActive ? 'bg-amber-400 animate-ping' : 'bg-purple-400'
                }`}
              />
              <span className="text-[11px] font-mono tracking-widest text-purple-400 uppercase font-bold">
                Crisis Mesh Engine • Real-Time Broadcast Control
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sliders className="text-purple-400" />
              Live Calamity Studio & Telemetry Desk
            </h1>
            <p className="text-xs text-slate-400">
              Manipulate disaster parameters in real-time. All dials broadcast immediately across all open tabs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Mesh Status:</span>
            <span className="bg-purple-950 border border-purple-800 text-purple-300 px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
              <Radio size={12} className="text-purple-400 animate-pulse" />
              CONNECTED (Zero-Delay)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Quick Disaster Presets */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            Disaster Scenario Presets (1-Click Broadcast)
          </h2>
          <span className="text-[11px] text-slate-400">Instantly applies realistic telemetry</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset('FLASH_FLOOD')}
            className="p-3 bg-red-950/40 border border-red-800/80 hover:border-red-600 rounded-2xl text-left transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold text-red-400 group-hover:text-red-300">
                Flash Flood Surge
              </span>
              <AlertOctagon size={14} className="text-red-400" />
            </div>
            <p className="text-[11px] text-slate-400">Palar 48k cusecs • 8.8m Gauge • Power Cut</p>
          </button>

          <button
            onClick={() => applyPreset('CYCLONE')}
            className="p-3 bg-blue-950/40 border border-blue-800/80 hover:border-blue-600 rounded-2xl text-left transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold text-blue-400 group-hover:text-blue-300">
                Category 2 Cyclone
              </span>
              <Wind size={14} className="text-blue-400" />
            </div>
            <p className="text-[11px] text-slate-400">140 km/h Wind • 7.6m Gauge • Downed Lines</p>
          </button>

          <button
            onClick={() => applyPreset('DAM_BURST')}
            className="p-3 bg-purple-950/40 border border-purple-800/80 hover:border-purple-600 rounded-2xl text-left transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold text-purple-400 group-hover:text-purple-300">
                Dam Gate Burst
              </span>
              <Waves size={14} className="text-purple-400" />
            </div>
            <p className="text-[11px] text-slate-400">Mordhana 29k cusecs • 9.9m Gauge • Max Flood</p>
          </button>

          <button
            onClick={() => applyPreset('BASELINE')}
            className="p-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl text-left transition group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold text-slate-300 group-hover:text-white">
                Normal Baseline
              </span>
              <RotateCcw size={14} className="text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400">Safe Discharge • 4.2m Gauge • Grid Active</p>
          </button>
        </div>
      </div>

      {/* 3. Interactive Calamity Dials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Dial 1: Palar River Discharge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Waves size={16} className="text-blue-400" />
              Palar River Discharge
            </span>
            <span className="text-xs font-mono font-black text-blue-400">
              {dials.palarDischargeCusecs.toLocaleString()} cusecs
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="60000"
            step="1000"
            value={dials.palarDischargeCusecs}
            onChange={(e) => updateDial('palarDischargeCusecs', parseInt(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 (Dry)</span>
            <span className="text-amber-500">25k (Alert)</span>
            <span className="text-red-500">50k+ (Catastrophic)</span>
          </div>
        </div>

        {/* Dial 2: River Gauge Level (Danger Mark 7.5m) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Gauge size={16} className="text-emerald-400" />
              River Gauge Level
            </span>
            <span
              className={`text-xs font-mono font-black ${
                dials.riverGaugeMeters >= 7.5 ? 'text-red-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {dials.riverGaugeMeters.toFixed(1)} m{' '}
              {dials.riverGaugeMeters >= 7.5 && '⚠️ ABOVE DANGER'}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="10.5"
            step="0.1"
            value={dials.riverGaugeMeters}
            onChange={(e) => updateDial('riverGaugeMeters', parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 m</span>
            <span className="text-red-400 font-bold">7.5m Danger Line</span>
            <span>10.5 m (Max)</span>
          </div>
        </div>

        {/* Dial 3: Mordhana Dam Release */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Activity size={16} className="text-cyan-400" />
              Mordhana Dam Release
            </span>
            <span className="text-xs font-mono font-black text-cyan-400">
              {dials.mordhanaDamCusecs.toLocaleString()} cusecs
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="30000"
            step="500"
            value={dials.mordhanaDamCusecs}
            onChange={(e) => updateDial('mordhanaDamCusecs', parseInt(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 cusecs</span>
            <span className="text-amber-500">15k Gate Open</span>
            <span className="text-red-500">30k Full Spillway</span>
          </div>
        </div>

        {/* Dial 4: Cyclone Wind Speed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Wind size={16} className="text-amber-400" />
              Cyclone Wind Speed
            </span>
            <span className="text-xs font-mono font-black text-amber-400">
              {dials.cycloneWindKmh} km/h
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="180"
            step="5"
            value={dials.cycloneWindKmh}
            onChange={(e) => updateDial('cycloneWindKmh', parseInt(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 (Calm)</span>
            <span>65 km/h (Gale)</span>
            <span className="text-red-500">130+ km/h (Cat 2)</span>
          </div>
        </div>

        {/* Dial 5: Street Inundation Depth */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Waves size={16} className="text-indigo-400" />
              Street Inundation Depth
            </span>
            <span className="text-xs font-mono font-black text-indigo-400">
              {dials.streetInundationFeet.toFixed(1)} ft
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="6.5"
            step="0.1"
            value={dials.streetInundationFeet}
            onChange={(e) => updateDial('streetInundationFeet', parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0 ft</span>
            <span className="text-amber-400">2.5 ft (Waist)</span>
            <span className="text-red-500">5+ ft (Impassable)</span>
          </div>
        </div>

        {/* Dial 6: Power Grid Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Zap size={16} className="text-yellow-400" />
              TNEB Power Grid State
            </span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                dials.gridPowerOutage
                  ? 'bg-red-950 text-red-400 border border-red-800'
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              {dials.gridPowerOutage ? 'BLACKOUT' : 'ENERGIZED'}
            </span>
          </div>

          <p className="text-xs text-slate-400 my-2">
            Simulate grid shutdown. Toggles emergency generator protocols and offline SMS backups.
          </p>

          <button
            onClick={() => updateDial('gridPowerOutage', !dials.gridPowerOutage)}
            className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition font-mono ${
              dials.gridPowerOutage
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {dials.gridPowerOutage ? 'Restore Electrical Grid' : 'Trigger Grid Blackout'}
          </button>
        </div>
      </div>

      {/* 4. Live Hazard Spawner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <PlusCircle size={16} className="text-purple-400" />
          Live Hazard Spawner (Cross-Window Injection)
        </h3>
        <p className="text-xs text-slate-400">
          Inject spontaneous hazard points into the live Leaflet map. Broadcasts instantly to all active responder & citizen portals.
        </p>

        <form onSubmit={handleSpawnHazard} className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Hazard description (e.g. Fallen Banyan Tree on Chittoor Highway)"
            value={spawnTitle}
            onChange={(e) => setSpawnTitle(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            required
          />

          <select
            value={spawnType}
            onChange={(e) => setSpawnType(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          >
            <option value="FLOOD_DEEP">Severe Waterlogging</option>
            <option value="LIVE_WIRE">Downed Powerline</option>
            <option value="BRIDGE_CLOSED">Damaged Bridge</option>
            <option value="FALLEN_TREE">Tree Obstruction</option>
          </select>

          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold px-5 py-2 rounded-xl text-xs transition whitespace-nowrap shadow-lg shadow-purple-600/30"
          >
            Spawn & Broadcast
          </button>
        </form>
      </div>
    </div>
  );
};
