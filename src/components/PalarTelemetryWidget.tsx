import React from 'react';
import { Waves, AlertOctagon, TrendingUp, Info } from 'lucide-react';
import type { PalarTelemetry, Language } from '../types/disaster';
import { translations } from '../utils/translations';

interface PalarTelemetryProps {
  telemetry: PalarTelemetry;
  lang: Language;
}

export const PalarTelemetryWidget: React.FC<PalarTelemetryProps> = ({ telemetry, lang }) => {
  const t = translations[lang];

  return (
    <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/60 border-y border-red-800/60 px-3 py-2 text-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: River Surge Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/40 px-2.5 py-1 rounded-md">
            <Waves className="text-red-400 animate-pulse" size={16} />
            <span className="text-xs font-semibold uppercase text-red-300">
              {t.palarDischarge}:
            </span>
            <span className="text-sm font-mono font-black text-white">
              {telemetry.dischargeRateCusecs.toLocaleString()} {t.cusecs}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-600/20 border border-amber-500/40 px-2.5 py-1 rounded-md">
            <TrendingUp className="text-amber-400" size={16} />
            <span className="text-xs font-semibold uppercase text-amber-300">
              {t.dangerThreshold}:
            </span>
            <span className="text-sm font-mono font-bold text-white">
              {telemetry.riverGaugeMeters}m / {telemetry.dangerMarkMeters}m
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-xs text-slate-300">
            <span className="text-slate-400">{t.mordhanaDam}:</span>
            <span className="font-mono font-bold text-amber-300">
              {telemetry.mordhanaDamDischargeCusecs.toLocaleString()} {t.cusecs}
            </span>
          </div>
        </div>

        {/* Right: Urgent Local Advisory */}
        <div className="flex items-center gap-2 text-xs">
          <AlertOctagon size={16} className="text-red-400 shrink-0" />
          <p className="font-medium text-red-200 line-clamp-1">
            {lang === 'en' ? telemetry.advisoryText : telemetry.tamilAdvisoryText}
          </p>
          <span className="hidden xl:inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
            <Info size={11} /> {telemetry.lastUpdated}
          </span>
        </div>
      </div>
    </div>
  );
};
