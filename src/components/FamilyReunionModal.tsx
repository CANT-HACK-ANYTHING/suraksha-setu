import React, { useState } from 'react';
import { Search, X, ShieldCheck, HeartHandshake, MapPin } from 'lucide-react';
import type { MissingPersonReport, SafeCheckIn, Language } from '../types/disaster';
import { translations } from '../utils/translations';

interface FamilyReunionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingPersons: MissingPersonReport[];
  safeCheckIns: SafeCheckIn[];
  onAddSafeCheckIn: (checkIn: SafeCheckIn) => void;
  onReportMissing: (missing: MissingPersonReport) => void;
  lang: Language;
}

export const FamilyReunionModal: React.FC<FamilyReunionModalProps> = ({
  isOpen,
  onClose,
  missingPersons,
  safeCheckIns,
  onAddSafeCheckIn,
  onReportMissing,
  lang,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'CHECKIN' | 'MISSING' | 'SEARCH'>('SEARCH');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // CheckIn Form State
  const [checkInName, setCheckInName] = useState<string>('');
  const [familyCount, setFamilyCount] = useState<number>(4);
  const [locationName, setLocationName] = useState<string>('VIT Indoor Stadium Relief Camp');
  const [checkInPhone, setCheckInPhone] = useState<string>('+91 9');

  // Missing Form State
  const [personName, setPersonName] = useState<string>('');
  const [personAge, setPersonAge] = useState<number>(25);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'CHILD'>('MALE');
  const [lastSeen, setLastSeen] = useState<string>('');
  const [clothing, setClothing] = useState<string>('');
  const [reporterPhone, setReporterPhone] = useState<string>('+91 ');

  const [notification, setNotification] = useState<string | null>(null);

  const t = translations[lang];

  if (!isOpen) return null;

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInName.trim()) return;

    const newCheckIn: SafeCheckIn = {
      id: `chk-${Date.now()}`,
      name: checkInName,
      familySize: familyCount,
      currentShelterOrLocation: locationName,
      phone: checkInPhone,
      status: 'SAFE_AT_SHELTER',
      timestamp: 'Just now',
    };

    onAddSafeCheckIn(newCheckIn);
    setCheckInName('');
    setNotification('Safe status registered and broadcasted to local camps!');
    setTimeout(() => {
      setNotification(null);
      setActiveSubTab('SEARCH');
    }, 1800);
  };

  const handleMissingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;

    const newReport: MissingPersonReport = {
      id: `mis-${Date.now()}`,
      personName,
      age: personAge,
      gender,
      lastSeenLocation: lastSeen,
      clothingDescription: clothing,
      reportedBy: 'Family Member',
      contactPhone: reporterPhone,
      status: 'SEARCHING',
      timestamp: 'Just now',
    };

    onReportMissing(newReport);
    setPersonName('');
    setNotification('Missing person bulletin transmitted to all camp coordinators & rescue boats!');
    setTimeout(() => {
      setNotification(null);
      setActiveSubTab('SEARCH');
    }, 1800);
  };

  const filteredSafe = safeCheckIns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredMissing = missingPersons.filter((m) =>
    m.personName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-5 text-slate-100 my-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-900 border border-slate-800"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
            <HeartHandshake size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">{t.reunionTitle}</h2>
            <p className="text-xs text-emerald-400">
              {lang === 'en'
                ? 'Privacy-Preserved Family Reunification & Safe Locator Network'
                : 'குடும்ப பாதுகாப்பு பதிவு மற்றும் ஒருங்கிணைப்பு தளம்'}
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('SEARCH')}
            className={`py-1.5 rounded-lg transition ${
              activeSubTab === 'SEARCH' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Search Directory
          </button>
          <button
            onClick={() => setActiveSubTab('CHECKIN')}
            className={`py-1.5 rounded-lg transition ${
              activeSubTab === 'CHECKIN' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            + I Am Safe
          </button>
          <button
            onClick={() => setActiveSubTab('MISSING')}
            className={`py-1.5 rounded-lg transition ${
              activeSubTab === 'MISSING' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            + Report Missing
          </button>
        </div>

        {notification && (
          <div className="bg-emerald-950 border border-emerald-500 p-2.5 rounded-xl text-emerald-300 text-xs font-bold text-center">
            {notification}
          </div>
        )}

        {/* View 1: Search Directory */}
        {activeSubTab === 'SEARCH' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by family or person name..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Safe check-ins results */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                SAFE CITIZENS IN RELIEF CAMPS ({filteredSafe.length})
              </span>
              {filteredSafe.map((item) => (
                <div key={item.id} className="bg-slate-900/90 border border-emerald-900/60 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck size={14} />
                      {item.name} ({item.familySize} Members)
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                      SAFE AT SHELTER
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400" />
                    {item.currentShelterOrLocation}
                  </p>
                  <p className="text-[10px] text-slate-500">{item.timestamp}</p>
                </div>
              ))}

              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block pt-2">
                ACTIVE SEARCH BULLETINS ({filteredMissing.length})
              </span>
              {filteredMissing.map((item) => (
                <div key={item.id} className="bg-slate-900/90 border border-rose-900/60 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span className="text-rose-300">{item.personName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        item.status === 'FOUND_SAFE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-rose-950 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    <b>Last seen:</b> {item.lastSeenLocation} • <b>Details:</b> {item.clothingDescription}
                  </p>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Reported by: {item.reportedBy}</span>
                    <span className="font-mono">{item.contactPhone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View 2: Check-In Form */}
        {activeSubTab === 'CHECKIN' && (
          <form onSubmit={handleCheckInSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Your Name / Family Head:</label>
              <input
                type="text"
                required
                value={checkInName}
                onChange={(e) => setCheckInName(e.target.value)}
                placeholder="e.g. S. Ramanathan"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Total Family Size:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={familyCount}
                  onChange={(e) => setFamilyCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Emergency Phone:</label>
                <input
                  type="text"
                  required
                  value={checkInPhone}
                  onChange={(e) => setCheckInPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Current Shelter or Safe Location:</label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. VIT Indoor Stadium Camp / Relatives at Gandhi Nagar"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition"
            >
              BROADCAST SAFE STATUS
            </button>
          </form>
        )}

        {/* View 3: Report Missing */}
        {activeSubTab === 'MISSING' && (
          <form onSubmit={handleMissingSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Missing Person Name:</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Age:</label>
                <input
                  type="number"
                  min="1"
                  max="110"
                  value={personAge}
                  onChange={(e) => setPersonAge(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Last Seen Location & Circumstances:</label>
              <input
                type="text"
                required
                value={lastSeen}
                onChange={(e) => setLastSeen(e.target.value)}
                placeholder="e.g. Shenbakkam riverbank during boat evacuation"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Gender:</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'CHILD')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="CHILD">Child</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Your Contact Phone:</label>
                <input
                  type="text"
                  required
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Clothing & Identifiable Features:</label>
              <input
                type="text"
                required
                value={clothing}
                onChange={(e) => setClothing(e.target.value)}
                placeholder="e.g. Blue shirt, walking stick, hearing aid"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition"
            >
              PUBLISH MISSING PERSON BULLETIN
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
