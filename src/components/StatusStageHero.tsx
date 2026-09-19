import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Map,
  PhoneCall,
  LifeBuoy,
  Radio,
  MapPin,
  Waves,
  Mountain,
  ChevronDown,
  ZapOff,
  Volume2,
  CloudRain,
  Activity,
  AlertCircle,
} from 'lucide-react';
import type { Language, CalamitySimulationControls, PalarTelemetry } from '../types/disaster';

interface StatusStageHeroProps {
  stage?: 'DANGER' | 'NEAR_DANGER' | 'SAFE';
  autoLoop?: boolean;
  onOpenSOS: () => void;
  onOpenMap: () => void;
  onOpenShelters: () => void;
  onOpenHelplines: () => void;
  lang: Language;
  calamityControls?: CalamitySimulationControls;
  telemetry?: PalarTelemetry;
  activeHazardsCount?: number;
}

export const StatusStageHero: React.FC<StatusStageHeroProps> = ({
  stage = 'DANGER',
  autoLoop = false,
  onOpenSOS,
  onOpenMap,
  onOpenShelters,
  onOpenHelplines,
  lang,
  calamityControls,
  telemetry,
  activeHazardsCount = 0,
}) => {
  const stagesData = {
    DANGER: {
      file: '/D.mp4',
      code: 'd.mp4',
      bigTitle: 'DANGER',
      subTitleEn: 'LEVEL 3: IMMEDIATE EVACUATION ORDER',
      subTitleHi: 'स्तर ३: तुरंत सुरक्षित स्थान पर जाएं',
      subTitleTa: 'நிலை 3: உடனடியாக வெளியேறும் உத்தரவு',
      statusEn: 'Palar River surge has breached Katpadi low-lying causeway. Water level rising fast.',
      statusHi: 'पालाड़ नदी का जलभराव आपके क्षेत्र तक पहुँच गया है। जलस्तर तेजी से बढ़ रहा है।',
      statusTa: 'பாலாற்று வெள்ள நீர் உங்கள் பகுதிக்குள் நுழைகிறது. நீர்மட்டம் விரைவாக உயர்கிறது.',
      quoteEn: '“Disasters do not wait for tomorrow. Every minute on low ground is a minute lost. Move to high ground now.”',
      quoteHi: '“विपत्ति प्रतीक्षा नहीं करती। निचले इलाकों में बिताया हर पल जानलेवा हो सकता है। तुरंत ऊंचे स्थान पर जाएं।”',
      quoteTa: '“பேரிடர் எச்சரிக்கையோடு நிற்பதில்லை. பள்ளமான பகுதியில் இருக்கும் ஒவ்வொரு நிமிடமும் ஆபத்தானது. உடனே மேடான இடத்திற்கு செல்லுங்கள்.”',
      badgeBg: 'bg-red-600',
      glowClass: 'text-red-500 text-glow-red',
      borderAccent: 'border-red-500/60',
      accentColor: 'text-red-400',
      inundation: '4.8 ft (RISING FAST)',
      elevation: '214m (Low Ground)',
      icon: ShieldAlert,
    },
    NEAR_DANGER: {
      file: '/ND.mp4',
      code: 'nd.mp4',
      bigTitle: 'DANGER NEARBY',
      subTitleEn: 'LEVEL 2: WATCH & PREPARE ADVISORY',
      subTitleHi: 'स्तर २: सतर्कता क्षेत्र • तैयारी रखें',
      subTitleTa: 'நிலை 2: எச்சரிக்கை பகுதி • தயாராக இருங்கள்',
      statusEn: 'Water rising within 400m. Chittoor Road underpass waterlogged. Stay alert & pack essentials.',
      statusHi: 'जलस्तर ४०० मीटर के दायरे में बढ़ रहा है। जरूरी सामान पैक करें और तैयार रहें।',
      statusTa: '400 மீட்டர் தொலைவில் நீர் மட்டம் உயர்கிறது. வெளியேற தயாராக இருங்கள்.',
      quoteEn: '“Preparation turns panic into safety. Keep medicines dry, pack vital papers, know your exit route.”',
      quoteHi: '“तैयारी ही डर को सुरक्षा में बदलती है। दवाइयां और जरूरी कागजात सुरक्षित रखें।”',
      quoteTa: '“முன் எச்சரிக்கையே உயிரைக் காக்கும். மருந்துகள் மற்றும் முக்கிய ஆவணங்களை பாதுகாப்பாக எடுத்து வையுங்கள்.”',
      badgeBg: 'bg-amber-600',
      glowClass: 'text-amber-400 text-glow-amber',
      borderAccent: 'border-amber-500/60',
      accentColor: 'text-amber-400',
      inundation: '1.5 ft (Approaching)',
      elevation: '216m (Intermediate)',
      icon: AlertTriangle,
    },
    SAFE: {
      file: '/S.mp4',
      code: 's.mp4',
      bigTitle: 'SAFE',
      subTitleEn: 'LEVEL 1: ALL CLEAR / SAFE HAVEN',
      subTitleHi: 'स्तर १: सुरक्षित क्षेत्र • राहत शिविर सक्रिय',
      subTitleTa: 'நிலை 1: பாதுகாப்பானது • நிவாரண முகாம்',
      statusEn: 'You are in the safe elevated zone. VIT Stadium Relief Camp provides food, clean water and medical care.',
      statusHi: 'आप सुरक्षित ऊंचे क्षेत्र में हैं। वीआईटी स्टेडियम राहत शिविर में भोजन और प्राथमिक चिकित्सा उपलब्ध है।',
      statusTa: 'நீங்கள் பாதுகாப்பான மேட்டுப்பகுதியில் உள்ளீர்கள். விஐடி நிவாரண முகாமில் உணவு மற்றும் மருத்துவ உதவி தயார்.',
      quoteEn: '“Safety is not just high ground; it is knowing you are not alone. Rest here, relief is active.”',
      quoteHi: '“सुरक्षा केवल ऊंचा स्थान नहीं, यह विश्वास है कि आप अकेले नहीं हैं। राहत कार्य जारी है।”',
      quoteTa: '“பாதுகாப்பு என்பது மேடான இடம் மட்டுமல்ல; நாம் தனியாக இல்லை என்ற நம்பிக்கை. இங்கே ஓய்வெடுங்கள்.”',
      badgeBg: 'bg-emerald-600',
      glowClass: 'text-emerald-400 text-glow-emerald',
      borderAccent: 'border-emerald-500/60',
      accentColor: 'text-emerald-400',
      inundation: 'DRY (0 ft)',
      elevation: '228m (High Ground)',
      icon: ShieldCheck,
    },
  };

  const current = stagesData[stage] || stagesData.DANGER;
  const StageIcon = current.icon;

  const scrollToContent = () => {
    const el = document.getElementById('emergency-actions-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getSubTitle = () => {
    if (lang === 'hi') return current.subTitleHi;
    if (lang === 'ta') return current.subTitleTa;
    return current.subTitleEn;
  };

  const getStatus = () => {
    if (telemetry?.advisoryText) {
      if (lang === 'hi' && telemetry.hindiAdvisoryText) return telemetry.hindiAdvisoryText;
      if (lang === 'ta' && telemetry.tamilAdvisoryText) return telemetry.tamilAdvisoryText;
      return telemetry.advisoryText;
    }
    if (lang === 'hi') return current.statusHi;
    if (lang === 'ta') return current.statusTa;
    return current.statusEn;
  };

  const getQuote = () => {
    if (lang === 'hi') return current.quoteHi;
    if (lang === 'ta') return current.quoteTa;
    return current.quoteEn;
  };

  return (
    <div className="relative flex-1 flex flex-col w-full px-3 sm:px-6">
      {/* ============================================================ */}
      {/* 🎬 1. FULL-PAGE COVER VIDEO: 100% VISIBLE, CRISP & VIVID      */}
      {/* ============================================================ */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none select-none">
        <video
          key={current.file}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-100 transition-opacity duration-700 scale-105"
          src={current.file}
        />
        {/* Very light, transparent top and bottom gradients to ensure text visibility while keeping the video clear */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/75 pointer-events-none" />
      </div>

      {/* ============================================================ */}
      {/* 📺 STAGE 1 (INITIAL VIEWPORT): FULL VIDEO + MASSIVE FONT     */}
      {/* ============================================================ */}
      <section className="relative z-10 min-h-[calc(100vh-100px)] flex flex-col justify-between max-w-6xl mx-auto w-full pt-3 pb-6">
        {/* Top Broadcast Badges Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase text-white shadow-2xl flex items-center gap-2 ${current.badgeBg}`}
            >
              <Radio size={14} className="animate-pulse" />
              <span>{getSubTitle()}</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/20 text-slate-300 font-mono text-[11px] px-3 py-1.5 rounded-full shadow">
              <span>BROADCAST:</span>
              <b className="text-white">{current.code}</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {autoLoop && (
              <span className="bg-blue-600/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-full border border-blue-400 animate-pulse shadow-lg">
                🔁 AUTO-CYCLE (6s)
              </span>
            )}

            <span className="bg-black/65 backdrop-blur-md border border-white/20 text-emerald-400 font-mono text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>DEOC 1077 OFFICIAL</span>
            </span>
          </div>
        </div>

        {/* Center Screen: Massive Typography in Suitable Font */}
        <div className="my-auto flex flex-col items-center text-center space-y-4 sm:space-y-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <StageIcon
              size={80}
              className={`sm:w-24 sm:h-24 md:w-32 md:h-32 drop-shadow-[0_8px_30px_rgba(0,0,0,1)] ${
                stage === 'DANGER'
                  ? 'text-red-500 animate-bounce'
                  : stage === 'NEAR_DANGER'
                  ? 'text-amber-400 animate-pulse'
                  : 'text-emerald-400'
              }`}
            />
            <h1
              className={`font-crisis text-7xl sm:text-9xl md:text-[11rem] lg:text-[12.5rem] font-black tracking-wider leading-none uppercase ${current.glowClass} drop-shadow-[0_12px_45px_rgba(0,0,0,1)] select-none`}
            >
              {current.bigTitle}
            </h1>
          </div>

          {/* Plain-Language Status Bar */}
          <div className="max-w-3xl px-4 py-2 rounded-2xl bg-black/55 backdrop-blur-md border border-white/20 shadow-2xl">
            <p className="text-base sm:text-xl md:text-2xl text-white font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,1)] leading-snug">
              {getStatus()}
            </p>
          </div>
        </div>

        {/* Bouncing Scroll Down Prompt (Pushed-Down Content indicator) */}
        <div
          onClick={scrollToContent}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && scrollToContent()}
          className="flex flex-col items-center justify-center gap-1.5 cursor-pointer transition hover:scale-105 active:scale-95 group select-none pt-2"
        >
          <div className="flex items-center gap-2 bg-black/65 hover:bg-black/85 backdrop-blur-md px-5 py-2 rounded-full border border-white/30 group-hover:border-white/60 transition shadow-2xl">
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white drop-shadow">
              {lang === 'en'
                ? 'SCROLL FOR RESCUE & EVACUATION ACTIONS'
                : lang === 'hi'
                ? 'राहत एवं बचाव कार्यों के लिए नीचे स्क्रॉल करें'
                : 'மீட்பு நடவடிக்கைகளுக்கு கீழே உருட்டவும்'}
            </span>
            <ChevronDown size={18} className="text-white animate-bounce" />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 📜 STAGE 2 (PUSHED DOWN): COMES UP ON SCROLL & CONTINUES     */}
      {/* ============================================================ */}
      <section
        id="emergency-actions-section"
        className="relative z-10 max-w-6xl mx-auto w-full py-8 space-y-5 scroll-mt-14"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
            <h2 className="text-base sm:text-xl font-black text-white tracking-wide uppercase drop-shadow">
              {lang === 'en'
                ? 'EMERGENCY ACTIONS & LOCAL SURVIVAL PROTOCOLS'
                : lang === 'hi'
                ? 'आपातकालीन कदम एवं सुरक्षा प्रोटोकॉल'
                : 'அவசர கால பாதுகாப்பு வழிமுறைகள்'}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-300 bg-black/70 px-3 py-1 rounded-full border border-white/20">
            KATPADI • WARD 12
          </span>
        </div>

        {/* 🚨 Dynamic Calamity Warning Banners (Reflected from Calamity Studio) */}
        {calamityControls?.sirenActive && (
          <div className="bg-red-600/95 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-red-300 flex items-center justify-between shadow-2xl shadow-red-950 animate-pulse">
            <div className="flex items-center gap-2">
              <Volume2 size={18} className="animate-bounce" />
              <span>🚨 OFFICIAL EMERGENCY EVACUATION SIREN SOUNDING IN VELLORE / KATPADI!</span>
            </div>
            <span className="font-mono text-xs bg-red-950 px-2.5 py-0.5 rounded border border-red-800">
              DEOC 1077
            </span>
          </div>
        )}

        {calamityControls && !calamityControls.powerGridActive && (
          <div className="bg-amber-950/90 border border-amber-500/80 text-amber-200 text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2.5">
              <ZapOff size={18} className="text-amber-400 shrink-0 animate-pulse" />
              <div>
                <b>⚡ TANGEDCO GRID OUTAGE:</b> Feeder lines disconnected to prevent electrocution in floodwaters. Conserve phone battery.
              </div>
            </div>
            <span className="font-mono text-[10px] text-amber-400 font-bold bg-black/60 px-2 py-0.5 rounded">
              BLACKOUT ACTIVE
            </span>
          </div>
        )}

        {activeHazardsCount > 0 && (
          <div
            onClick={onOpenMap}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpenMap()}
            className="cursor-pointer bg-red-950/80 hover:bg-red-900/80 border border-red-700/80 text-red-200 text-xs px-4 py-2 rounded-xl flex items-center justify-between transition shadow-xl group select-none"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-red-400 animate-pulse" />
              <span>
                <b>⚠️ {activeHazardsCount} ACTIVE ROAD HAZARDS IN KATPADI:</b> Submerged causeways or downed cables logged.
              </span>
            </div>
            <span className="underline font-bold text-red-300 group-hover:text-white transition">
              Open Safe Bypass Route →
            </span>
          </div>
        )}

        {/* Poignant Human Survival Quote Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-black/80 border border-white/20 backdrop-blur-md shadow-2xl">
          <p className="italic text-sm sm:text-base md:text-lg font-medium text-slate-100 leading-relaxed drop-shadow">
            {getQuote()}
          </p>
        </div>

        {/* Live Real-Time Telemetry Chips (DIRECTLY REFLECTS CALAMITY STUDIO) */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs sm:text-sm font-mono">
          {/* Dynamic Inundation */}
          <div className="bg-black/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-xl flex items-center gap-2">
            <Waves size={16} className={current.accentColor} />
            <span>
              Inundation:{' '}
              <b className={current.accentColor}>
                {calamityControls
                  ? `${calamityControls.inundationDepthFeet.toFixed(1)} ft`
                  : current.inundation}
              </b>
              {calamityControls && calamityControls.inundationDepthFeet >= 3.5 && (
                <span className="text-[10px] ml-1.5 px-1.5 py-0.2 bg-red-600 text-white font-bold rounded animate-pulse">
                  SURGE
                </span>
              )}
            </span>
          </div>

          {/* Dynamic Palar Flow & Gauge */}
          <div className="bg-black/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-xl flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <span>
              Palar Flow:{' '}
              <b className="text-blue-300">
                {calamityControls
                  ? `${calamityControls.riverDischargeCusecs.toLocaleString()} cusecs`
                  : '31,500 cusecs'}
              </b>
              <span className="text-slate-400 text-xs ml-1.5">
                ({calamityControls ? calamityControls.riverGaugeMeters.toFixed(1) : '8.4'}m gauge)
              </span>
            </span>
          </div>

          {/* Dynamic Rainfall & Wind */}
          <div className="bg-black/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-xl flex items-center gap-2">
            <CloudRain size={16} className="text-cyan-400" />
            <span>
              Rain:{' '}
              <b className="text-cyan-300">
                {calamityControls ? `${calamityControls.rainfallMmPerHour} mm/h` : '85 mm/h'}
              </b>
              <span className="text-slate-400 mx-1.5">•</span>
              <span>
                Wind:{' '}
                <b className="text-white">
                  {calamityControls ? `${calamityControls.windSpeedKmh} km/h` : '45 km/h'}
                </b>
              </span>
            </span>
          </div>

          {/* Dynamic Elevation */}
          <div className="bg-black/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 shadow-xl flex items-center gap-2">
            <Mountain size={16} className="text-emerald-400" />
            <span>
              Elevation: <b className="text-emerald-400">{current.elevation}</b>
            </span>
          </div>

          {/* Location Chip */}
          <div className="bg-black/85 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-slate-300 shadow-xl flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" />
            <span>Katpadi Ward 12 • Palar River Basin</span>
          </div>
        </div>



        {/* 🔘 3. FOUR CLEAR CITIZEN ACTION CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1 pb-4">
          {/* Card 1: Urgent Help SOS */}
          <button
            onClick={onOpenSOS}
            className="group p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold shadow-2xl shadow-red-950/80 border border-red-400/50 text-left transition active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-widest text-red-200 font-black block">
                {lang === 'en' ? 'IF TRAPPED' : lang === 'hi' ? 'यदि फंसे हैं' : 'சிக்கியிருந்தால்'}
              </span>
              <h3 className="text-lg font-black mt-0.5 flex items-center gap-2">
                <LifeBuoy size={20} className="animate-spin-slow" />
                <span>{lang === 'en' ? 'I NEED HELP (SOS)' : lang === 'hi' ? 'मदद चाहिए (SOS)' : 'உடனடி உதவி (SOS)'}</span>
              </h3>
              <p className="text-xs text-red-100/90 mt-1">
                {lang === 'en' ? 'Boat & medical rescue' : 'बचाव नाव एवं चिकित्सा'}
              </p>
            </div>
            <div className="flex items-center justify-end mt-3 text-xs font-bold text-red-100">
              <span className="group-hover:translate-x-1 transition flex items-center gap-1">
                <span>SEND SOS</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </button>

          {/* Card 2: Safe Shelter */}
          <button
            onClick={onOpenShelters}
            className="group p-4 rounded-2xl bg-black/85 hover:bg-black/95 border border-emerald-500/80 hover:border-emerald-400 text-white font-extrabold shadow-2xl backdrop-blur-md text-left transition active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-black block">
                {lang === 'en' ? 'NEAREST DRY GROUND' : lang === 'hi' ? 'निकटतम सुरक्षित स्थान' : 'அருகிலுள்ள முகாம்'}
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                {lang === 'en' ? 'VIT Indoor Stadium' : lang === 'hi' ? 'वीआईटी इनडोर शिविर' : 'விஐடி நிவாரண முகாம்'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                ✅ 116 beds • 🍲 Hot food • ⚡ Solar
              </p>
            </div>
            <div className="flex items-center justify-end mt-3 text-xs font-bold text-emerald-400">
              <span className="group-hover:translate-x-1 transition flex items-center gap-1">
                <span>VIEW DETAILS</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </button>

          {/* Card 3: Evacuation Map */}
          <button
            onClick={onOpenMap}
            className="group p-4 rounded-2xl bg-black/85 hover:bg-black/95 border border-blue-500/70 hover:border-blue-400 text-white font-extrabold shadow-2xl backdrop-blur-md text-left transition active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-widest text-blue-400 font-black block">
                {lang === 'en' ? 'NAVIGATION' : lang === 'hi' ? 'मार्ग दर्शन' : 'வழி வரைபடம்'}
              </span>
              <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <Map size={18} className="text-blue-400" />
                <span>{lang === 'en' ? 'Safe Route Map' : lang === 'hi' ? 'सुरक्षित नक्शा' : 'பாதுகாப்பு வழி'}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {lang === 'en' ? 'Avoids submerged causeway' : 'बाढ़ से सुरक्षित बाईपास'}
              </p>
            </div>
            <div className="flex items-center justify-end mt-3 text-xs font-bold text-blue-400">
              <span className="group-hover:translate-x-1 transition flex items-center gap-1">
                <span>OPEN MAP</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </button>

          {/* Card 4: Emergency Helplines */}
          <button
            onClick={onOpenHelplines}
            className="group p-4 rounded-2xl bg-black/85 hover:bg-black/95 border border-amber-500/70 hover:border-amber-400 text-white font-extrabold shadow-2xl backdrop-blur-md text-left transition active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-black block">
                {lang === 'en' ? 'EMERGENCY DIAL' : lang === 'hi' ? 'हेल्पलाइन' : 'அவசர உதவி'}
              </span>
              <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <PhoneCall size={18} className="text-amber-400" />
                <span>{lang === 'en' ? 'Helpline 1077' : lang === 'hi' ? 'हेल्पलाइन १०७७' : 'உதவி 1077'}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Direct: <b>1077</b> (DEOC) / <b>1070</b>
              </p>
            </div>
            <div className="flex items-center justify-end mt-3 text-xs font-bold text-amber-400">
              <span className="group-hover:translate-x-1 transition flex items-center gap-1">
                <span>CALL NOW</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
