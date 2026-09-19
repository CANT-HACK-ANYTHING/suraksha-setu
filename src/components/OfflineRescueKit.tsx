import React from 'react';
import { Phone, Shield, X, CheckSquare, ZapOff, Droplets, AlertTriangle } from 'lucide-react';
import { EMERGENCY_HELPLINES } from '../data/mockVelloreData';
import type { Language } from '../types/disaster';
import { translations } from '../utils/translations';

interface OfflineRescueKitProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const OfflineRescueKit: React.FC<OfflineRescueKitProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-5 text-slate-100 my-auto space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/20 border border-blue-500 flex items-center justify-center text-blue-400">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">{t.firstAidTitle}</h2>
            <p className="text-xs text-slate-400">
              {lang === 'en'
                ? 'Pre-cached locally • Available during cellular grid collapse'
                : 'ஆஃப்லைனில் சேமிக்கப்பட்ட அவசர உதவி கையேடு'}
            </p>
          </div>
        </div>

        {/* Quick Dial Helplines */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Phone size={13} />
            <span>{t.helplines}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EMERGENCY_HELPLINES.map((h, i) => (
              <a
                key={i}
                href={`tel:${h.number}`}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between transition group"
              >
                <div>
                  <b className="text-xs text-white block group-hover:text-blue-300">{h.name}</b>
                  <span className="text-[10px] text-slate-400">{h.subtitle}</span>
                </div>
                <div className="bg-red-600/20 border border-red-500/40 text-red-400 group-hover:bg-red-600 group-hover:text-white px-2 py-1 rounded text-xs font-mono font-bold transition">
                  {h.number}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Critical Life-Safety Instructions */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
          <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-red-400" />
            <span>Critical Survival Actions</span>
          </h3>

          <div className="space-y-2 text-slate-300">
            <div className="flex items-start gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <ZapOff className="text-amber-400 shrink-0 mt-0.5" size={15} />
              <div>
                <b className="text-white">Electrical Isolation:</b> Turn off the main circuit breaker before water reaches ground floor sockets. Never touch submerged inverter batteries or power poles.
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <Droplets className="text-blue-400 shrink-0 mt-0.5" size={15} />
              <div>
                <b className="text-white">Safe Drinking Water:</b> Do not consume tap or floodwater. Boil for at least 3 minutes, or use Chlorine/Halazone tablets. Store 2 liters per person in high spots.
              </div>
            </div>

            <div className="flex items-start gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
              <CheckSquare className="text-emerald-400 shrink-0 mt-0.5" size={15} />
              <div>
                <b className="text-white">Waterproof Go-Bag:</b> Pack Aadhaar cards, medical prescriptions, power banks, and dry clothes in sealed plastic ziplock pouches.
              </div>
            </div>
          </div>
        </div>

        {/* Close CTA */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
        >
          {lang === 'en' ? 'CLOSE EMERGENCY GUIDE' : 'மூடு'}
        </button>
      </div>
    </div>
  );
};
