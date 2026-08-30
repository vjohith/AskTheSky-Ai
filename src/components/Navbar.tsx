import React from 'react';
import { CloudLightning, ShieldAlert, Globe2, User, Volume2, Bell, AlertTriangle, Megaphone } from 'lucide-react';
import { Language, UserRole, UserAccount } from '../types';
import { i18n } from '../i18n';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  user: UserAccount | null;
  onOpenAuth: () => void;
  onTriggerEmergencyMode: () => void;
  activeAlertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  userRole,
  setUserRole,
  user,
  onOpenAuth,
  onTriggerEmergencyMode,
  activeAlertCount
}) => {
  const t = i18n[language];

  return (
    <header className="sticky top-0 z-40 bg-[#0c1633]/95 backdrop-blur-md border-b border-blue-900/60 text-white shadow-xl shadow-black/20">
      {/* Top Banner / Ticker */}
      <div className="bg-gradient-to-r from-red-950/90 via-[#180a1c]/90 to-red-950/90 px-4 py-1.5 border-b border-red-900/60 text-xs flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-2 text-red-200 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm shadow-red-900/50">
            IMD & NDMA ALERT
          </span>
          <span className="truncate max-w-xl text-red-100 font-medium text-xs">
            Cyclonic Storm Alert over Bay of Bengal & River Inundation Watch active. High precautions advised.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-blue-200/80">
          <span className="bg-blue-900/60 text-blue-200 border border-blue-700/60 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold">
            {t.sihBadge}
          </span>
          <span className="text-blue-200/90 text-[11px]">“Ask the Sky. Know the Risk. Stay Safe.”</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Slogan */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-blue-600 p-0.5 shadow-lg shadow-blue-600/30 flex items-center justify-center border border-blue-400/30">
            <div className="w-full h-full bg-blue-600 rounded-[10px] flex items-center justify-center text-white">
              <CloudLightning className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white font-display">
                AskTheSky AI
              </span>
              <span className="bg-blue-900/70 text-blue-200 border border-blue-700/60 text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider">
                SIH Project
              </span>
            </div>
            <p className="text-xs text-blue-200/80 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#081026] p-1.5 rounded-2xl border border-blue-900/50 shadow-inner">
          <button
            id="nav-dashboard"
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-200/80 hover:text-white hover:bg-blue-900/40'
            }`}
          >
            {t.nav.dashboard}
          </button>
          <button
            id="nav-ai-chat"
            onClick={() => setCurrentTab('aiChat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'aiChat'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-200/80 hover:text-white hover:bg-blue-900/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            {t.nav.aiChat}
          </button>
          <button
            id="nav-map"
            onClick={() => setCurrentTab('map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'map'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-200/80 hover:text-white hover:bg-blue-900/40'
            }`}
          >
            {t.nav.interactiveMap}
          </button>
          <button
            id="nav-let-them-know"
            onClick={() => setCurrentTab('letThemKnow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'letThemKnow'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-teal-300 hover:text-white hover:bg-teal-900/40'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-teal-400" />
            <span>{t.nav.letThemKnow || 'LetThemKnow'}</span>
          </button>
          <button
            id="nav-emergency"
            onClick={() => setCurrentTab('emergency')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'emergency'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-rose-300 hover:text-white hover:bg-rose-900/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {t.nav.emergency}
          </button>
          <button
            id="nav-history"
            onClick={() => setCurrentTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-200/80 hover:text-white hover:bg-blue-900/40'
            }`}
          >
            {t.nav.history}
          </button>
          <button
            id="nav-vault"
            onClick={() => setCurrentTab('vault')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'vault'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-blue-200/80 hover:text-white hover:bg-blue-900/40'
            }`}
          >
            {t.nav.vault}
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Persona Role Selector */}
          <div className="hidden sm:block">
            <select
              id="role-selector"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-[#081026] border border-blue-800/60 text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-400 cursor-pointer font-medium shadow-inner"
              title="Select tailored advisory role"
            >
              <option value="general">👥 {t.roles.general}</option>
              <option value="farmer">🌾 {t.roles.farmer}</option>
              <option value="fisherman">🎣 {t.roles.fisherman}</option>
              <option value="traveler">🧳 {t.roles.traveler}</option>
              <option value="student">🎒 {t.roles.student}</option>
            </select>
          </div>

          {/* Language Selector (EN / TE / HI) */}
          <div className="flex items-center gap-0.5 bg-[#081026] border border-blue-900/50 rounded-xl p-0.5">
            <button
              id="lang-en"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs rounded-lg font-bold transition-all ${
                language === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-200/80 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              id="lang-te"
              onClick={() => setLanguage('te')}
              className={`px-2 py-1 text-xs rounded-lg font-bold transition-all ${
                language === 'te' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-200/80 hover:text-white'
              }`}
            >
              తెలుగు
            </button>
            <button
              id="lang-hi"
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 text-xs rounded-lg font-bold transition-all ${
                language === 'hi' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-200/80 hover:text-white'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* SOS Emergency Trigger Button */}
          <button
            id="emergency-sos-btn"
            onClick={onTriggerEmergencyMode}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-rose-500/40"
            title="Trigger High-Contrast Emergency Mode & Siren"
          >
            <ShieldAlert className="w-4 h-4 animate-bounce" />
            <span className="hidden sm:inline">SOS EMERGENCY</span>
            <span className="sm:hidden">SOS</span>
          </button>

          {/* User Account / Auth */}
          <button
            id="user-auth-btn"
            onClick={() => {
              setCurrentTab('auth');
              if (typeof window !== 'undefined' && window.history) {
                window.history.pushState({}, '', '/login');
              }
            }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all border font-semibold cursor-pointer ${
              currentTab === 'auth'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                : 'bg-[#081026] hover:bg-blue-900/40 text-blue-100 border-blue-800/60'
            }`}
            title="Citizen Account & Security Vault"
          >
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline max-w-[110px] truncate">
              {user ? user.name.split(' ')[0] : 'Sign In'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="lg:hidden flex items-center justify-around border-t border-blue-900/60 bg-[#0c1633]/95 py-2 px-2 overflow-x-auto">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap ${
            currentTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-200/80'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setCurrentTab('aiChat')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap ${
            currentTab === 'aiChat' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-200/80'
          }`}
        >
          Ask AI
        </button>
        <button
          onClick={() => setCurrentTab('map')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap ${
            currentTab === 'map' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-200/80'
          }`}
        >
          Hazard Map
        </button>
        <button
          onClick={() => setCurrentTab('letThemKnow')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap ${
            currentTab === 'letThemKnow' ? 'bg-teal-600 text-white shadow-sm' : 'text-teal-300'
          }`}
        >
          LetThemKnow
        </button>
        <button
          onClick={() => setCurrentTab('emergency')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap ${
            currentTab === 'emergency' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-300'
          }`}
        >
          Emergency
        </button>
        <button
          onClick={() => setCurrentTab('vault')}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap ${
            currentTab === 'vault' ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-200/80'
          }`}
        >
          Vault
        </button>
        <button
          onClick={() => {
            setCurrentTab('auth');
            if (typeof window !== 'undefined' && window.history) {
              window.history.pushState({}, '', '/login');
            }
          }}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg whitespace-nowrap ${
            currentTab === 'auth' ? 'bg-blue-600 text-white shadow-sm' : 'text-sky-300'
          }`}
        >
          {user ? 'Profile' : 'Sign In'}
        </button>
      </div>
    </header>
  );
};
