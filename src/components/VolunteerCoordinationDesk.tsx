import React from 'react';
import { Users, Ship, HeartPulse, Utensils, Navigation, Shield, CheckCircle } from 'lucide-react';
import type { VolunteerResource, Language } from '../types/disaster';
import { translations } from '../utils/translations';

interface VolunteerCoordinationDeskProps {
  volunteers: VolunteerResource[];
  onToggleStatus: (id: string) => void;
  lang: Language;
}

export const VolunteerCoordinationDesk: React.FC<VolunteerCoordinationDeskProps> = ({
  volunteers,
  onToggleStatus,
  lang,
}) => {
  const t = translations[lang];

  const getSkillIcon = (skill: VolunteerResource['skill']) => {
    switch (skill) {
      case 'BOAT_OPERATOR':
        return <Ship size={14} className="text-blue-400" />;
      case 'PARAMEDIC_DOCTOR':
        return <HeartPulse size={14} className="text-red-400" />;
      case 'COMMUNITY_KITCHEN_CHEF':
        return <Utensils size={14} className="text-amber-400" />;
      default:
        return <Navigation size={14} className="text-emerald-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-extrabold text-sm">
          <Users size={18} className="text-blue-400" />
          <span>{t.volunteersTitle}</span>
        </div>
        <span className="text-[10px] bg-blue-950 border border-blue-700 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
          {volunteers.filter((v) => v.status === 'DEPLOYED').length} DEPLOYED IN FIELD
        </span>
      </div>

      <div className="space-y-2.5">
        {volunteers.map((vol) => {
          const isDeployed = vol.status === 'DEPLOYED';
          return (
            <div
              key={vol.id}
              className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-slate-700 text-xs space-y-1.5 transition"
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    {getSkillIcon(vol.skill)}
                    <span>{vol.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({vol.phoneMasked})</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">{vol.assetDetails}</p>
                </div>

                <button
                  onClick={() => onToggleStatus(vol.id)}
                  className={`text-[10px] px-2 py-1 rounded font-bold font-mono transition flex items-center gap-1 ${
                    isDeployed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {isDeployed && <CheckCircle size={10} />}
                  <span>{vol.status}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span className="flex items-center gap-1">
                  <Shield size={11} className="text-slate-500" />
                  Assigned: <b className="text-slate-300">{vol.assignedZone}</b>
                </span>
                <span className="text-emerald-400">Verified Volunteer</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
