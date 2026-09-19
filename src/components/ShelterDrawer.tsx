import React from 'react';
import {
  Home,
  ShieldCheck,
  Zap,
  Baby,
  HeartPulse,
  Navigation,
  Phone,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import type { Shelter, Language } from '../types/disaster';
import { translations } from '../utils/translations';

interface ShelterDrawerProps {
  shelters: Shelter[];
  selectedShelter: Shelter | null;
  onSelectShelter: (shelter: Shelter) => void;
  activeTab: 'SHELTERS' | 'REPORT' | 'SURVIVAL';
  setActiveTab: (tab: 'SHELTERS' | 'REPORT' | 'SURVIVAL') => void;
  onOpenReportModal: () => void;
  lang: Language;
}

export const ShelterDrawer: React.FC<ShelterDrawerProps> = ({
  shelters,
  selectedShelter,
  onSelectShelter,
  activeTab,
  setActiveTab,
  onOpenReportModal,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="bg-slate-950 border-t border-slate-800 text-slate-100 flex-1 flex flex-col">
      {/* Category Tabs */}
      <div className="flex border-b border-slate-800/90 px-3 bg-slate-900/60 overflow-x-auto">
        <button
          onClick={() => setActiveTab('SHELTERS')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition ${
            activeTab === 'SHELTERS'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home size={14} />
          <span>{t.activeShelters} ({shelters.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('REPORT');
            onOpenReportModal();
          }}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition ${
            activeTab === 'REPORT'
              ? 'border-amber-500 text-amber-400 bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle size={14} />
          <span>{t.reportHazard}</span>
        </button>

        <button
          onClick={() => setActiveTab('SURVIVAL')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition ${
            activeTab === 'SURVIVAL'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={14} />
          <span>{t.survivalKit}</span>
        </button>
      </div>

      {/* Shelters List View */}
      {activeTab === 'SHELTERS' && (
        <div className="p-3 overflow-y-auto max-h-[380px] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{lang === 'en' ? 'Showing verified camps outside flood elevation' : 'வெள்ளப் பாதிப்பில்லாத முகாம்கள்'}</span>
            <span className="text-emerald-400 font-mono font-semibold">
              ● {lang === 'en' ? 'Live Capacity Tracking' : 'நேரலை படுக்கை நிலை'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {shelters.map((shelter) => {
              const freeBeds = shelter.capacityTotal - shelter.capacityOccupied;
              const pctOccupied = Math.round(
                (shelter.capacityOccupied / shelter.capacityTotal) * 100
              );
              const isSelected = selectedShelter?.id === shelter.id;

              return (
                <div
                  key={shelter.id}
                  onClick={() => onSelectShelter(shelter)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                        <span>{lang === 'en' ? shelter.name : shelter.tamilName}</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{shelter.address}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-black text-emerald-400">
                        {freeBeds} {lang === 'en' ? 'left' : 'மீதம்'}
                      </span>
                      <p className="text-[10px] text-slate-400">{shelter.distanceKm} km</p>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{t.occupancy}: {pctOccupied}%</span>
                      <span>{shelter.capacityOccupied} / {shelter.capacityTotal} beds</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pctOccupied > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pctOccupied}%` }}
                      />
                    </div>
                  </div>

                  {/* Amenities Badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {shelter.amenities.solarPower && (
                      <span className="bg-amber-950/70 border border-amber-800/80 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <Zap size={11} /> ⚡ Solar Backup
                      </span>
                    )}
                    {shelter.amenities.babyFood && (
                      <span className="bg-pink-950/70 border border-pink-800/80 text-pink-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <Baby size={11} /> 🍼 Baby Food
                      </span>
                    )}
                    {shelter.amenities.medicalAid && (
                      <span className="bg-red-950/70 border border-red-800/80 text-red-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <HeartPulse size={11} /> 🏥 Medical
                      </span>
                    )}
                  </div>

                  {/* Action row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectShelter(shelter);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <Navigation size={13} />
                      <span>{t.navigateRoute}</span>
                    </button>

                    <a
                      href={`tel:${shelter.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded flex items-center gap-1 text-[11px]"
                    >
                      <Phone size={11} />
                      <span>{shelter.phone}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
