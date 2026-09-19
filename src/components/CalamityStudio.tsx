import React from 'react';
import {
  Sliders,
  Waves,
  Wind,
  CloudRain,
  Zap,
  ZapOff,
  Radio,
  RotateCcw,
  PlusCircle,
  Volume2,
  TrendingUp,
  Activity,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import type {
  CalamitySimulationControls,
  PalarTelemetry,
  HazardIncident,
  Language,
} from '../types/disaster';

interface CalamityStudioProps {
  controls: CalamitySimulationControls;
  telemetry: PalarTelemetry;
  onUpdateControls: (updated: Partial<CalamitySimulationControls>) => void;
  onInjectHazard: (hazard: HazardIncident) => void;
  onResetSimulation: () => void;
  onTriggerSiren: () => void;
  onSetBroadcastStage: (stage: 'DANGER' | 'NEAR_DANGER' | 'SAFE') => void;
  currentBroadcastStage: 'DANGER' | 'NEAR_DANGER' | 'SAFE';
  autoLoop: boolean;
  onToggleAutoLoop: () => void;
  lang: Language;
}

export const CalamityStudio: React.FC<CalamityStudioProps> = ({
  controls,
  telemetry,
  onUpdateControls,
  onInjectHazard,
  onResetSimulation,
  onTriggerSiren,
  onSetBroadcastStage,
  currentBroadcastStage,
  autoLoop,
  onToggleAutoLoop,
  lang: _lang,
}) => {
  const isDangerBreached = controls.riverGaugeMeters >= 7.5 || controls.riverDischargeCusecs >= 28000;

  const handleQuickFloodSpike = () => {
    onUpdateControls({
      riverDischargeCusecs: 38000,
      riverGaugeMeters: 9.2,
      mordhanaDamDischargeCusecs: 18500,
      inundationDepthFeet: 5.4,
      rainfallMmPerHour: 140,
      powerGridActive: false,
    });
    onSetBroadcastStage('DANGER');
  };

  const handleQuickCycloneSpike = () => {
    onUpdateControls({
      windSpeedKmh: 135,
      rainfallMmPerHour: 180,
      inundationDepthFeet: 4.2,
      powerGridActive: false,
      activeCalamity: 'CYCLONE',
    });
    onSetBroadcastStage('DANGER');
  };

  const injectKangeyanallurHazard = () => {
    onInjectHazard({
      id: `haz-custom-${Date.now()}`,
      type: 'FLOOD_DEEP',
      title: 'Kangeyanallur Causeway Submerged under violent flood surge',
      hindiTitle: 'कांगेयनल्लूर काजवे पर भारी जलभराव',
      tamilTitle: 'காங்கேயநல்லூர் தரைப்பாலம் கடும் வெள்ளத்தில் மூழ்கியது',
      location: [12.9460, 79.1350],
      roadName: 'Kangeyanallur - Vellore Old Bridge Road',
      waterDepthFeet: controls.inundationDepthFeet || 4.8,
      status: 'AUTHORITY_VERIFIED',
      upvotes: 45,
      reportedAt: 'Just now',
      reportedBy: 'Calamity Studio Simulator',
    });
  };

  const injectLiveWireHazard = () => {
    onInjectHazard({
      id: `haz-custom-${Date.now()}`,
      type: 'LIVE_WIRE',
      title: '11KV High-Voltage Cable snapped into standing floodwater',
      hindiTitle: 'बिजली का तार पानी में टूटा',
      tamilTitle: 'வெள்ள நீரில் அறுந்து விழுந்த 11KV மின்கம்பி',
      location: [12.9340, 79.1150],
      roadName: 'Shenbakkam Lowland Road',
      status: 'AUTHORITY_VERIFIED',
      upvotes: 31,
      reportedAt: 'Just now',
      reportedBy: 'Aapda Mitra Scout',
    });
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 overflow-y-auto">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/80 px-2.5 py-0.5 rounded border border-amber-700/60">
                ORCHESTRATION & TELEMETRY DESK (PAGE 4)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Sliders className="text-amber-400" size={24} />
              <span>LIVE CALAMITY STUDIO & TELEMETRY INJECTOR</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Adjust live hydrological, meteorological, and infrastructure parameters. Slider adjustments dynamically recalculate the Decision Risk Index ($R$) and trigger alerts across the Citizen, Command, and Field Responder portals.
            </p>
          </div>

          {/* Quick Trigger Presets & Reset */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleQuickFloodSpike}
              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow-lg shadow-red-950 transition flex items-center gap-1.5"
              title="Instantly surge Palar river to 38,000 cusecs"
            >
              <Waves size={14} />
              <span>FLASH FLOOD SPIKE</span>
            </button>

            <button
              onClick={handleQuickCycloneSpike}
              className="px-3 py-1.5 bg-cyan-600/90 hover:bg-cyan-500 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-950 transition flex items-center gap-1.5"
              title="Trigger 135 km/h Cyclone Gusts"
            >
              <Wind size={14} />
              <span>CYCLONE SPIKE</span>
            </button>

            <button
              onClick={onResetSimulation}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
              title="Reset parameters to safe baseline"
            >
              <RotateCcw size={14} />
              <span>RESET CALM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Sliders on Left, Live Impact on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Interactive Dials & Sliders */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="text-blue-400" size={18} />
              <span>Real-Time Environmental & Inundation Dials</span>
            </h3>

            {/* Slider 1: Palar River Discharge */}
            <div className="space-y-1.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Waves size={15} className="text-blue-400" />
                  <span>Palar River Discharge Flow:</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-white bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {controls.riverDischargeCusecs.toLocaleString()} cusecs
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    controls.riverDischargeCusecs > 28000 ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {controls.riverDischargeCusecs > 28000 ? 'DANGER SURGE' : 'MODERATE'}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="5000"
                max="50000"
                step="500"
                value={controls.riverDischargeCusecs}
                onChange={(e) => onUpdateControls({ riverDischargeCusecs: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5,000 cusecs (Safe)</span>
                <span>25,000 (Danger Mark)</span>
                <span>50,000 (Catastrophic)</span>
              </div>
            </div>

            {/* Slider 2: River Water Gauge Level vs Danger Mark */}
            <div className="space-y-1.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-amber-400" />
                  <span>Kangeyanallur River Gauge (Danger Threshold: 7.5m):</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-white bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    {controls.riverGaugeMeters.toFixed(1)} meters
                  </span>
                  {isDangerBreached ? (
                    <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded animate-bounce">
                      BREACHED +{(controls.riverGaugeMeters - 7.5).toFixed(1)}m
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                      SAFE GROUND
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="4.0"
                max="12.0"
                step="0.1"
                value={controls.riverGaugeMeters}
                onChange={(e) => onUpdateControls({ riverGaugeMeters: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>4.0m (Dry)</span>
                <span className="text-amber-400 font-bold">7.5m (DANGER LINE)</span>
                <span>12.0m (Extreme Flood)</span>
              </div>
            </div>

            {/* Sliders Grid (Dam Release + Rainfall + Wind + Inundation) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dam Discharge */}
              <div className="space-y-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300">Mordhana Dam Sluice:</span>
                  <span className="font-mono font-black text-amber-300">
                    {controls.mordhanaDamDischargeCusecs.toLocaleString()} cusecs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25000"
                  step="500"
                  value={controls.mordhanaDamDischargeCusecs}
                  onChange={(e) => onUpdateControls({ mordhanaDamDischargeCusecs: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Rainfall mm/hr */}
              <div className="space-y-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <CloudRain size={13} className="text-blue-400" />
                    <span>Rainfall Intensity:</span>
                  </span>
                  <span className="font-mono font-black text-blue-300">
                    {controls.rainfallMmPerHour} mm/hr
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="250"
                  step="5"
                  value={controls.rainfallMmPerHour}
                  onChange={(e) => onUpdateControls({ rainfallMmPerHour: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Wind Speed (Cyclone) */}
              <div className="space-y-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1">
                    <Wind size={13} className="text-cyan-400" />
                    <span>Wind Gust Speed:</span>
                  </span>
                  <span className="font-mono font-black text-cyan-300">
                    {controls.windSpeedKmh} km/h
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="180"
                  step="5"
                  value={controls.windSpeedKmh}
                  onChange={(e) => onUpdateControls({ windSpeedKmh: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Inundation Depth */}
              <div className="space-y-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-300">Street Inundation Depth:</span>
                  <span className="font-mono font-black text-red-300">
                    {controls.inundationDepthFeet.toFixed(1)} feet
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="7.0"
                  step="0.2"
                  value={controls.inundationDepthFeet}
                  onChange={(e) => onUpdateControls({ inundationDepthFeet: Number(e.target.value) })}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Infrastructure Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">TANGEDCO Power Grid:</span>
                <button
                  onClick={() => onUpdateControls({ powerGridActive: !controls.powerGridActive })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    controls.powerGridActive
                      ? 'bg-emerald-950 border border-emerald-600 text-emerald-300'
                      : 'bg-red-950 border border-red-600 text-red-300 animate-pulse'
                  }`}
                >
                  {controls.powerGridActive ? <Zap size={13} /> : <ZapOff size={13} />}
                  <span>{controls.powerGridActive ? 'ENERGIZED (NORMAL)' : 'ISOLATED (BLACKOUT FOR SAFETY)'}</span>
                </button>
              </div>

              {/* Emergency Siren Broadcast Button */}
              <button
                onClick={onTriggerSiren}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-red-950 transition"
              >
                <Volume2 size={15} className="animate-pulse" />
                <span>SOUND EMERGENCY SIREN</span>
              </button>
            </div>
          </div>

          {/* Quick Hazard Spawner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="text-emerald-400" size={17} />
              <span>Live Crisis Incident Spawner (Pushes to Maps & Command)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={injectKangeyanallurHazard}
                className="p-3 bg-slate-950 hover:bg-slate-850 border border-red-800/80 rounded-xl text-left text-xs transition group"
              >
                <b className="text-red-400 block group-hover:text-red-300">
                  + Submerge Kangeyanallur Causeway
                </b>
                <span className="text-slate-400 text-[11px]">
                  Simulates 4.8ft floodwaters closing the primary Vellore old bridge.
                </span>
              </button>

              <button
                onClick={injectLiveWireHazard}
                className="p-3 bg-slate-950 hover:bg-slate-850 border border-amber-800/80 rounded-xl text-left text-xs transition group"
              >
                <b className="text-amber-400 block group-hover:text-amber-300">
                  + Drop 11KV Live Wire in Shenbakkam
                </b>
                <span className="text-slate-400 text-[11px]">
                  Flags extreme electrocution risk in standing street water.
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Live Broadcast Controller & Real-Time Impact */}
        <div className="space-y-4">
          {/* Citizen Broadcast Stage Sync */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-white font-extrabold text-sm">
              <Radio size={18} className="text-red-400 animate-pulse" />
              <span>CITIZEN SCREEN BROADCAST (D.mp4 / ND.mp4 / S.mp4)</span>
            </div>
            <p className="text-xs text-slate-300">
              Force what video and stage every citizen sees on their mobile device in Page 1:
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onSetBroadcastStage('DANGER')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-between transition ${
                  currentBroadcastStage === 'DANGER'
                    ? 'bg-red-600 text-white border-red-400 shadow-xl shadow-red-950'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-left">
                  <div className="font-black text-sm">1. BROADCAST: D.mp4</div>
                  <span className="text-[11px] opacity-90">Level 3: Immediate Evacuation (Red)</span>
                </div>
                {currentBroadcastStage === 'DANGER' && <CheckCircle2 size={16} />}
              </button>

              <button
                onClick={() => onSetBroadcastStage('NEAR_DANGER')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-between transition ${
                  currentBroadcastStage === 'NEAR_DANGER'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-xl shadow-amber-950'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-left">
                  <div className="font-black text-sm">2. BROADCAST: ND.mp4</div>
                  <span className="text-[11px] opacity-90">Level 2: Watch & Prepare (Amber)</span>
                </div>
                {currentBroadcastStage === 'NEAR_DANGER' && <CheckCircle2 size={16} />}
              </button>

              <button
                onClick={() => onSetBroadcastStage('SAFE')}
                className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-between transition ${
                  currentBroadcastStage === 'SAFE'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-xl shadow-emerald-950'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-left">
                  <div className="font-black text-sm">3. BROADCAST: S.mp4</div>
                  <span className="text-[11px] opacity-90">Level 1: Safe Zone / Shelters Active (Green)</span>
                </div>
                {currentBroadcastStage === 'SAFE' && <CheckCircle2 size={16} />}
              </button>
            </div>

            {/* Auto Loop Toggle */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Demo Presentation Loop:</span>
              <button
                onClick={onToggleAutoLoop}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition ${
                  autoLoop
                    ? 'bg-blue-950 border-blue-500 text-blue-300 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {autoLoop ? '⏹️ STOP AUTO LOOP' : '▶️ AUTO LOOP (6s)'}
              </button>
            </div>
          </div>

          {/* Real-Time Algorithmic Decision Support Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-400" />
              <span>Calculated Composite Risk (R)</span>
            </h4>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-3xl font-black font-mono text-white">
                  {telemetry.riskBreakdown.compositeScore}/100
                </span>
                <span className="block text-[11px] text-slate-400 mt-0.5">
                  Formula: 0.30P + 0.25W + 0.20D + 0.15V + 0.10E
                </span>
              </div>
              <div className={`px-3 py-1.5 rounded-xl font-black text-xs font-mono shadow-md ${
                telemetry.riskBreakdown.threatStatus === 'RED'
                  ? 'bg-red-600 text-white'
                  : telemetry.riskBreakdown.threatStatus === 'ORANGE'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {telemetry.riskBreakdown.threatStatus} ALERT
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              When $R \ge 75$, the platform automatically alerts the NDRF 4th Battalion and recommends immediate low-ground evacuations for Katpadi and Shenbakkam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
