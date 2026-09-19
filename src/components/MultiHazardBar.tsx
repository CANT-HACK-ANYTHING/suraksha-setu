import React from 'react';
import { Waves, Wind, Mountain, Sun, Activity } from 'lucide-react';
import type { CalamityType, Language } from '../types/disaster';

interface MultiHazardBarProps {
  selectedHazard: CalamityType;
  onSelectHazard: (h: CalamityType) => void;
  lang: Language;
}

export const MultiHazardBar: React.FC<MultiHazardBarProps> = ({
  selectedHazard,
  onSelectHazard,
  lang,
}) => {
  const hazards: { id: CalamityType; labelEn: string; labelHi: string; labelTa: string; icon: React.ReactNode; badge: string }[] = [
    {
      id: 'FLOOD',
      labelEn: 'Floods & Surge',
      labelHi: 'बाढ़ एवं जलभराव',
      labelTa: 'வெள்ளப்பெருக்கு',
      icon: <Waves size={14} className="text-blue-400" />,
      badge: 'ACTIVE LIVE',
    },
    {
      id: 'CYCLONE',
      labelEn: 'Cyclone & Wind',
      labelHi: 'चक्रवात एवं आंधी',
      labelTa: 'புயல் & காற்று',
      icon: <Wind size={14} className="text-cyan-400" />,
      badge: 'MODULAR',
    },
    {
      id: 'EARTHQUAKE',
      labelEn: 'Earthquake',
      labelHi: 'भूकंप एवं क्षति',
      labelTa: 'நிலநடுக்கம்',
      icon: <Activity size={14} className="text-rose-400" />,
      badge: 'MODULAR',
    },
    {
      id: 'LANDSLIDE',
      labelEn: 'Landslides',
      labelHi: 'भूस्खलन',
      labelTa: 'நிலச்சரிவு',
      icon: <Mountain size={14} className="text-amber-400" />,
      badge: 'MODULAR',
    },
    {
      id: 'HEATWAVE',
      labelEn: 'Heatwave',
      labelHi: 'लू एवं ताप लहर',
      labelTa: 'வெப்ப அலை',
      icon: <Sun size={14} className="text-yellow-400" />,
      badge: 'MODULAR',
    },
  ];

  const getLabel = (h: typeof hazards[0]) => {
    if (lang === 'hi') return h.labelHi;
    if (lang === 'ta') return h.labelTa;
    return h.labelEn;
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800/90 px-3 py-1.5 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase font-black tracking-wider shrink-0 mr-1">
          <span>HAZARDS:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {hazards.map((h) => {
            const isSelected = selectedHazard === h.id;
            return (
              <button
                key={h.id}
                onClick={() => onSelectHazard(h.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-blue-600/30 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {h.icon}
                <span>{getLabel(h)}</span>
                {h.id === 'FLOOD' ? (
                  <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-mono font-black animate-pulse">
                    LIVE
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">
                    API
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Shared Data Schema Across All Hazards</span>
        </div>
      </div>
    </div>
  );
};
