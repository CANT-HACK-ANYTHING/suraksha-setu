import React, { useState } from 'react';
import {
  ShieldAlert,
  Radio,
  Wifi,
  WifiOff,
  Globe,
  Volume2,
  VolumeX,
  Layers,
  PhoneCall,
  Ship,
  Sliders,
} from 'lucide-react';
import type { Language, AppMode } from '../types/disaster';
import { translations } from '../utils/translations';

interface NavbarProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  onOpenHelplines: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  setMode,
  lang,
  setLang,
  isOffline,
  setIsOffline,
  onOpenHelplines,
}) => {
  const t = translations[lang];
  const [sirenPlaying, setSirenPlaying] = useState(false);

  // Web Audio API emergency alert tone generator (Works 100% offline!)
  const toggleSiren = () => {
    if (sirenPlaying) {
      setSirenPlaying(false);
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      // Emergency dual-tone modulation
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
      osc.frequency.linearRampToValueAtTime(800, now + 0.8);
      osc.frequency.linearRampToValueAtTime(1200, now + 1.2);
      osc.frequency.linearRampToValueAtTime(800, now + 1.6);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 2.0);

      setSirenPlaying(true);
      setTimeout(() => setSirenPlaying(false), 2000);
    } catch {
      setSirenPlaying(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-red-950/80 px-3 py-2 text-white">
      {/* Top Banner Alert Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 mb-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="font-mono uppercase font-bold tracking-wider text-red-400">
            {t.riskLevel}: {t.riskCell}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Siren Toggle */}
          <button
            onClick={toggleSiren}
            title="Play Emergency Alert Signal"
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
              sirenPlaying
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {sirenPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{sirenPlaying ? 'ALERT ACTIVE' : 'TEST SIREN'}</span>
          </button>

          {/* Quick Helplines button */}
          <button
            onClick={onOpenHelplines}
            className="flex items-center gap-1 bg-red-900/40 hover:bg-red-900/70 text-red-300 border border-red-800 px-2 py-0.5 rounded text-[11px] font-semibold"
          >
            <PhoneCall size={12} />
            <span>1077 / 1070</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Logo & Title */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-900/40">
            <ShieldAlert className="text-white" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-100">
                {t.appTitle}
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                v2.6 VIT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Control Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Trilingual Switcher (ENG / हिंदी / தமிழ்) */}
          <button
            onClick={() => {
              if (lang === 'en') setLang('hi');
              else if (lang === 'hi') setLang('ta');
              else setLang('en');
            }}
            className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs font-semibold hover:border-slate-500 transition"
            title="Toggle English / हिंदी / தமிழ்"
          >
            <Globe size={13} className="text-amber-400" />
            <span className="text-amber-300">
              {lang === 'en' ? 'ENG' : lang === 'hi' ? 'हिंदी' : 'தமிழ்'}
            </span>
          </button>

          {/* Offline Mode Simulator Toggle */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition ${
              isOffline
                ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-emerald-400 hover:border-slate-500'
            }`}
            title="Simulate Zero-Bandwidth Network Drop"
          >
            {isOffline ? (
              <>
                <WifiOff size={13} className="text-amber-400 animate-pulse" />
                <span className="hidden xs:inline">OFFLINE</span>
              </>
            ) : (
              <>
                <Wifi size={13} className="text-emerald-400" />
                <span className="hidden xs:inline">LIVE</span>
              </>
            )}
          </button>

          {/* 4-Portal Mode Switcher */}
          <div className="flex bg-slate-900/90 border border-slate-700/80 p-0.5 rounded-xl">
            <button
              onClick={() => setMode('CITIZEN_HELP')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                mode === 'CITIZEN_HELP' || mode === 'CITIZEN'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Citizen Help Portal"
            >
              <Radio size={13} />
              <span className="hidden sm:inline">Citizen</span>
            </button>

            <button
              onClick={() => setMode('COMMAND_CENTER')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                mode === 'COMMAND_CENTER'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="DEOC Command Center"
            >
              <Layers size={13} />
              <span className="hidden sm:inline">Command</span>
            </button>

            <button
              onClick={() => setMode('FIELD_RESPONDER')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                mode === 'FIELD_RESPONDER'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="NDRF & Volunteer Field Desk"
            >
              <Ship size={13} />
              <span className="hidden sm:inline">Responder</span>
            </button>

            <button
              onClick={() => setMode('CALAMITY_STUDIO')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                mode === 'CALAMITY_STUDIO'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Live Calamity Simulation Studio"
            >
              <Sliders size={13} />
              <span className="hidden sm:inline">Studio</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
