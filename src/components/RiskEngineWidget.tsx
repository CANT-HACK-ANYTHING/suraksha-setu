import React, { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import type { RiskFormulaWeights, Language } from '../types/disaster';
import { translations } from '../utils/translations';

interface RiskEngineWidgetProps {
  weights: RiskFormulaWeights;
  lang: Language;
}

export const RiskEngineWidget: React.FC<RiskEngineWidgetProps> = ({ weights, lang }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const t = translations[lang];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 text-slate-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        {/* Left: Summary pill & formula label */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
            <Calculator size={16} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-1">
                <ShieldAlert size={13} className="text-red-400" />
                {t.riskFormulaTitle}
              </span>
              <span className="font-mono text-xs font-black text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                R = {weights.compositeScore}/100 [{weights.threatStatus}]
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              R = 0.30P + 0.25W + 0.20D + 0.15V + 0.10E
            </p>
          </div>
        </div>

        {/* Right: Expandable breakdown toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 transition"
        >
          <span>{expanded ? (lang === 'en' ? 'Hide Math Breakdown' : 'கணக்கீட்டை மறை') : (lang === 'en' ? 'View Algorithmic Breakdown' : 'விரிவான கணக்கீடு')}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded Parameter Matrix */}
      {expanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block">0.30 • RAINFALL (P)</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="font-mono font-bold text-blue-400">{weights.rainfallForecastP}/100</span>
              <span className="font-mono text-[11px] text-slate-300">+{(0.3 * weights.rainfallForecastP).toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: `${weights.rainfallForecastP}%` }} />
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block">0.25 • RIVER SURGE (W)</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="font-mono font-bold text-cyan-400">{weights.riverWaterLevelW}/100</span>
              <span className="font-mono text-[11px] text-slate-300">+{(0.25 * weights.riverWaterLevelW).toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
              <div className="bg-cyan-500 h-full" style={{ width: `${weights.riverWaterLevelW}%` }} />
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block">0.20 • INUNDATION (D)</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="font-mono font-bold text-amber-400">{weights.inundationDepthD}/100</span>
              <span className="font-mono text-[11px] text-slate-300">+{(0.20 * weights.inundationDepthD).toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
              <div className="bg-amber-500 h-full" style={{ width: `${weights.inundationDepthD}%` }} />
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold block">0.15 • VULNERABILITY (V)</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="font-mono font-bold text-pink-400">{weights.vulnerabilityV}/100</span>
              <span className="font-mono text-[11px] text-slate-300">+{(0.15 * weights.vulnerabilityV).toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
              <div className="bg-pink-500 h-full" style={{ width: `${weights.vulnerabilityV}%` }} />
            </div>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 font-bold block">0.10 • EVACUATION CHOKE (E)</span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="font-mono font-bold text-red-400">{weights.evacuationDifficultyE}/100</span>
              <span className="font-mono text-[11px] text-slate-300">+{(0.10 * weights.evacuationDifficultyE).toFixed(1)}</span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
              <div className="bg-red-500 h-full" style={{ width: `${weights.evacuationDifficultyE}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
