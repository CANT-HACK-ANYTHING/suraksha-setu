import React, { useState } from 'react';
import { AlertTriangle, X, CheckCircle, MapPin } from 'lucide-react';
import type { HazardIncident, HazardType, Language } from '../types/disaster';

interface HazardReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitHazard: (hazard: HazardIncident) => void;
  lang: Language;
}

export const HazardReportModal: React.FC<HazardReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitHazard,
  lang,
}) => {
  const [type, setType] = useState<HazardType>('FLOOD_DEEP');
  const [title, setTitle] = useState<string>('Submerged Roadway near Katpadi');
  const [roadName, setRoadName] = useState<string>('Near Chittoor Bus Stop');
  const [waterDepth, setWaterDepth] = useState<number>(3.5);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newHazard: HazardIncident = {
      id: `haz-${Date.now()}`,
      type,
      title,
      hindiTitle: 'सड़क जलभराव एवं मार्ग अवरुद्ध',
      tamilTitle: 'சாலை வெள்ளம் மற்றும் போக்குவரத்து தடை',
      location: [12.9590, 79.1410],
      roadName,
      waterDepthFeet: type === 'FLOOD_DEEP' ? waterDepth : undefined,
      status: 'COMMUNITY_CONFIRMED',
      upvotes: 1,
      reportedAt: 'Just now',
      reportedBy: 'Citizen Reporter',
    };

    onSubmitHazard(newHazard);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-950 border border-amber-500/80 rounded-2xl shadow-2xl p-5 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-amber-600/20 border border-amber-500 flex items-center justify-center text-amber-400">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {lang === 'en' ? 'Report Road Hazard / Flood' : 'சாலை அடைப்பை பதிவு செய்'}
            </h2>
            <p className="text-xs text-amber-400">
              {lang === 'en'
                ? 'Alerts nearby citizens to dynamically avoid this route'
                : 'மற்றவர்கள் இவ்வழியைத் தவிர்க்க உடனடியாக வரைபடத்தில் காட்டப்படும்'}
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle size={44} className="text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white">
              {lang === 'en' ? 'Incident Verified & Mapped!' : 'தகவல் பதிவு செய்யப்பட்டது!'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'en' ? 'Safe Route Engine recalculated bypass corridor.' : 'பாதுகாப்பு மாற்று பாதை புதுப்பிக்கப்பட்டது.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                {lang === 'en' ? 'Hazard Type:' : 'அபாய வகை:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'FLOOD_DEEP', label: lang === 'en' ? '🌊 Deep Waterlogging' : '🌊 வெள்ள நீர்' },
                  { id: 'FALLEN_TREE', label: lang === 'en' ? '🌳 Fallen Tree' : '🌳 சாய்ந்த மரம்' },
                  { id: 'LIVE_WIRE', label: lang === 'en' ? '⚡ Live Wire Fallen' : '⚡ அறுந்த மின்கம்பி' },
                  { id: 'BRIDGE_CLOSED', label: lang === 'en' ? '⛔ Bridge Inundated' : '⛔ பாலம் மூழ்கியது' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as HazardType)}
                    className={`py-2 px-2.5 rounded-lg font-bold text-left transition border ${
                      type === item.id
                        ? 'bg-amber-600 text-white border-amber-400 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                <MapPin size={13} className="inline mr-1 text-amber-400" />
                {lang === 'en' ? 'Road / Location Name:' : 'சாலை / பகுதி பெயர்:'}
              </label>
              <input
                type="text"
                required
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. Kangeyanallur Road, Katpadi Underpass"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                {lang === 'en' ? 'Brief Description:' : 'விளக்கம்:'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {type === 'FLOOD_DEEP' && (
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="font-bold">{lang === 'en' ? 'Estimated Water Depth:' : 'நீர் ஆழம்:'}</span>
                  <span className="font-mono font-bold text-amber-400">{waterDepth} feet</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={waterDepth}
                  onChange={(e) => setWaterDepth(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl shadow-lg shadow-amber-950 flex items-center justify-center gap-2 mt-2 transition"
            >
              <AlertTriangle size={15} />
              <span>{lang === 'en' ? 'BROADCAST HAZARD ALERT' : 'எச்சரிக்கையை வெளியிடவும்'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
