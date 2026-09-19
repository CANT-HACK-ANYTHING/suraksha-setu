import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Users,
  Baby,
  HeartPulse,
  Send,
  MessageSquareShare,
  X,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import type { SOSRequest, WaterLevel, Language, EmergencyCategory } from '../types/disaster';
import { calculateTriageUrgency } from '../utils/triage';

interface RadialHoldSOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSOS: (newRequest: SOSRequest) => void;
  isOffline: boolean;
  lang: Language;
}

export const RadialHoldSOSModal: React.FC<RadialHoldSOSModalProps> = ({
  isOpen,
  onClose,
  onSubmitSOS,
  isOffline,
  lang,
}) => {
  const [category, setCategory] = useState<EmergencyCategory>('BOAT_EVACUATION');
  const [trappedCount, setTrappedCount] = useState<number>(3);
  const [hasInfants, setHasInfants] = useState<boolean>(true);
  const [hasElderly, setHasElderly] = useState<boolean>(true);
  const [hasPregnant, setHasPregnant] = useState<boolean>(false);
  const [medicalEmergency, setMedicalEmergency] = useState<boolean>(true);
  const [medicalDetails, setMedicalDetails] = useState<string>('Diabetic senior citizen, insulin submerged');
  const [waterLevel, setWaterLevel] = useState<WaterLevel>('FIRST_FLOOR_ROOFTOP');
  const [landmark, setLandmark] = useState<string>('Katpadi Silk Mill road, 1st floor residence');
  const [citizenName, setCitizenName] = useState<string>('Ramesh Sundaram');
  const [phone, setPhone] = useState<string>('+91 98410 54321');
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Live calculated score
  const triageResult = calculateTriageUrgency({
    trappedCount,
    hasInfants,
    hasElderlyOrDisabled: hasElderly,
    hasPregnantWomen: hasPregnant,
    medicalEmergency,
    waterLevel,
    distanceToRiverKm: 0.5, // Close to Palar
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRequest: SOSRequest = {
      id: `sos-${Date.now()}`,
      citizenName: citizenName || 'Anonymous Citizen',
      phone: phone || '+91 Emergency',
      location: [12.9620, 79.1350], // Near user location
      landmark,
      category,
      trappedCount,
      hasInfants,
      hasElderlyOrDisabled: hasElderly,
      hasPregnantWomen: hasPregnant,
      medicalEmergency,
      medicalDetails: medicalEmergency ? medicalDetails : undefined,
      waterLevel,
      urgencyScore: triageResult.score,
      priorityLevel: triageResult.priority,
      status: 'WAITING_DISPATCH',
      timestamp: 'Just now',
    };

    onSubmitSOS(newRequest);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  // Generate encoded SMS string for 1077
  const smsBody = `SOS VELLORE! LOC:12.962,79.135 ADDR:${encodeURIComponent(
    landmark
  )} TRAPPED:${trappedCount} INFANT:${hasInfants ? 1 : 0} ELDERLY:${hasElderly ? 1 : 0} WATER:${waterLevel} MED:${
    medicalEmergency ? 1 : 0
  }`;
  const smsLink = `sms:1077?body=${smsBody}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-950 border-2 border-red-600/90 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-100 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/50">
            <AlertCircle size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>{lang === 'en' ? 'EMERGENCY SOS INTAKE' : 'உடனடி உதவி (SOS) கோரிக்கை'}</span>
            </h2>
            <p className="text-xs text-red-400 font-semibold">
              {lang === 'en'
                ? 'Beams high-priority coordinates to NDRF 4th Battalion & DEOC Vellore (1077)'
                : '1077 மாவட்ட கட்டுப்பாட்டு மையம் மற்றும் மீட்புப் படைக்கு தகவல் அனுப்பப்படும்'}
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={54} className="text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-white">
              {lang === 'en' ? 'SOS BROADCAST TRANSMITTED!' : 'உதவி கோரிக்கை அனுப்பப்பட்டது!'}
            </h3>
            <p className="text-sm text-slate-300">
              {lang === 'en'
                ? 'Your triage priority has been logged as P1 - CRITICAL. Nearest NDRF boat unit assigned.'
                : 'உங்கள் கோரிக்கை அதிக முன்னுரிமையுடன் பதிவு செய்யப்பட்டது. மீட்புப் படகு விரைந்துள்ளது.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Live Triage Score Gauge */}
            <div className="bg-slate-900 border border-red-800/60 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">
                  {lang === 'en' ? 'Calculated Urgency Score' : 'அவசர நிலை குறியீடு'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-red-400 font-mono">
                    {triageResult.score}/100
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                      triageResult.priority === 'P1_CRITICAL'
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {triageResult.priority}
                  </span>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                <span>{lang === 'en' ? 'Algorithm: Multi-Factor Triage' : 'முன்னுரிமை வழிமுறை'}</span>
                <p className="text-emerald-400 font-semibold">
                  {lang === 'en' ? 'Disaster Protocol Active' : 'நெறிமுறை இயங்குகிறது'}
                </p>
              </div>
            </div>

            {/* Selectable Emergency Category */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                {lang === 'en' ? 'Select Emergency Category:' : 'அவசர உதவி வகை:'}
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                {[
                  { id: 'BOAT_EVACUATION', label: '🚤 Boat Rescue' },
                  { id: 'CRITICAL_MEDICAL', label: '🚨 Medical Crisis' },
                  { id: 'STRANDED_FAMILY', label: '🏠 Stranded' },
                  { id: 'FOOD_WATER', label: '🍞 Food/Water' },
                  { id: 'MISSING_PERSON', label: '🔍 Missing' },
                  { id: 'DAMAGED_BRIDGE_ROAD', label: '⛔ Bridge Cut' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id as EmergencyCategory)}
                    className={`py-1.5 px-2 rounded-lg font-bold transition border text-center truncate ${
                      category === cat.id
                        ? 'bg-red-600 text-white border-red-400 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trapped People Counter */}
            <div>
              <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Users size={14} className="text-amber-400" />
                <span>{lang === 'en' ? 'How many people are trapped?' : 'சிக்கியுள்ள நபர்களின் எண்ணிக்கை'}</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 6, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTrappedCount(num)}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                      trappedCount === num
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {num}{num === 10 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* High Vulnerability Checkboxes */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-300">
                {lang === 'en' ? 'Vulnerable groups present (+Priority Score):' : 'முன்னுரிமை தேவைப்படும் நபர்கள்:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={hasInfants}
                    onChange={(e) => setHasInfants(e.target.checked)}
                    className="accent-red-600 h-4 w-4"
                  />
                  <span className="flex items-center gap-1">
                    <Baby size={13} className="text-pink-400" />
                    <span>{lang === 'en' ? 'Infants / Kids' : 'பச்சிளம் குழந்தைகள்'}</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={hasElderly}
                    onChange={(e) => setHasElderly(e.target.checked)}
                    className="accent-red-600 h-4 w-4"
                  />
                  <span>{lang === 'en' ? 'Elderly / Disabled' : 'முதியோர் / மாற்றுத்திறனாளி'}</span>
                </label>

                <label className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={hasPregnant}
                    onChange={(e) => setHasPregnant(e.target.checked)}
                    className="accent-red-600 h-4 w-4"
                  />
                  <span>{lang === 'en' ? 'Pregnant Woman' : 'கர்ப்பிணிப் பெண்'}</span>
                </label>

                <label className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={medicalEmergency}
                    onChange={(e) => setMedicalEmergency(e.target.checked)}
                    className="accent-red-600 h-4 w-4"
                  />
                  <span className="flex items-center gap-1">
                    <HeartPulse size={13} className="text-red-400" />
                    <span className="text-red-300 font-bold">
                      {lang === 'en' ? 'Critical Medical' : 'அவசர சிகிச்சை'}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Medical Detail if true */}
            {medicalEmergency && (
              <div>
                <input
                  type="text"
                  value={medicalDetails}
                  onChange={(e) => setMedicalDetails(e.target.value)}
                  placeholder="e.g. Oxygen needed, dialysis patient, severe injury"
                  className="w-full bg-slate-900 border border-red-700/80 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            )}

            {/* Inundation Level Radios */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                {lang === 'en' ? 'Floodwater level at premises:' : 'தற்போதைய வெள்ள நீர் அளவு:'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'ANKLE_DEPTH', label: lang === 'en' ? 'Ankle (<1ft)' : 'கால் அளவு' },
                  { id: 'WAIST_DEPTH', label: lang === 'en' ? 'Waist (2-3ft)' : 'இடுப்பு அளவு' },
                  { id: 'FIRST_FLOOR_ROOFTOP', label: lang === 'en' ? 'Roof / Floor (>5ft)' : 'மாடி / கூரை' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWaterLevel(item.id as WaterLevel)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition text-center ${
                      waterLevel === item.id
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Offline Alert Badge if offline */}
            {isOffline && (
              <div className="bg-amber-950/80 border border-amber-600 p-2 rounded-lg text-amber-200 text-[11px] font-semibold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>
                  {lang === 'en'
                    ? 'Cellular Grid Disrupted: SMS Fallback will automatically be used.'
                    : 'அலைவரிசை துண்டிக்கப்பட்டுள்ளது: SMS வழியாக கோரிக்கை அனுப்பப்படும்.'}
                </span>
              </div>
            )}

            {/* Citizen Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">
                  {lang === 'en' ? 'Your Name:' : 'உங்கள் பெயர்:'}
                </label>
                <input
                  type="text"
                  required
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">
                  {lang === 'en' ? 'Contact Phone:' : 'தொடர்பு எண்:'}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">
                <MapPin size={12} className="inline mr-1 text-red-400" />
                {lang === 'en' ? 'Address / Landmark:' : 'முகவரி / அடையாளம்:'}
              </label>
              <input
                type="text"
                required
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold rounded-xl shadow-xl shadow-red-950/60 flex items-center justify-center gap-2 text-sm tracking-wide"
              >
                <Send size={16} />
                <span>
                  {lang === 'en' ? 'TRANSMIT SOS TO RESCUE COMMAND' : 'மீட்புப் படைக்கு SOS அனுப்பு'}
                </span>
              </button>

              {/* SMS Fallback Button for Zero-Net conditions */}
              <a
                href={smsLink}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-amber-600/70 text-amber-300 font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition"
              >
                <MessageSquareShare size={14} />
                <span>
                  {lang === 'en'
                    ? 'SEND VIA SMS TO 1077 (NO INTERNET NEEDED)'
                    : 'இணையம் இன்றி 1077 எண்ணிற்கு SMS அனுப்பவும்'}
                </span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Tactical Radial Hold Floating Trigger Component
interface RadialSOSButtonProps {
  onTrigger: () => void;
  lang: Language;
}

export const RadialSOSButton: React.FC<RadialSOSButtonProps> = ({ onTrigger, lang }) => {
  const [holding, setHolding] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  const startHold = () => {
    setHolding(true);
    setProgress(0);

    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds hold to trigger

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setHolding(false);
        setProgress(0);
        onTrigger();
      }
    }, 30);
  };

  const endHold = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center">
      <div
        className="relative select-none touch-none cursor-pointer"
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        onClick={onTrigger} // Quick click also opens the intake modal
      >
        {/* Pulsing Backlight */}
        <div className="absolute -inset-2 rounded-full bg-red-600/30 blur-md animate-pulse"></div>

        {/* SVG Radial Progress Ring */}
        <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="34"
            className="stroke-red-950"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            className="stroke-amber-400 transition-all duration-75"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={213.6}
            strokeDashoffset={213.6 - (213.6 * progress) / 100}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Button */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-red-600 to-rose-700 flex flex-col items-center justify-center text-white shadow-xl shadow-red-950 border-2 border-red-300/40">
          <AlertCircle size={20} className="text-white animate-bounce" />
          <span className="text-[11px] font-black tracking-tighter">SOS</span>
        </div>
      </div>
      <span className="mt-1 text-[10px] font-bold text-red-300 bg-black/80 px-2 py-0.5 rounded-full border border-red-900/60 shadow">
        {holding ? `${Math.round(progress)}% HOLD...` : lang === 'en' ? 'TAP FOR SOS' : 'உடனடி உதவி'}
      </span>
    </div>
  );
};
