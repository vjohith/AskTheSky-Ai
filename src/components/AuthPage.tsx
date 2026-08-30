import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Radio,
  CloudLightning,
  Waves,
  Tractor,
  Compass,
  GraduationCap,
  Users,
  LogOut,
  Settings,
  Flame,
  FileText,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { UserAccount, Language, UserRole } from '../types';
import { i18n } from '../i18n';
import { supabase } from '../supabaseClient';
import { auth, db } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthPageProps {
  user: UserAccount | null;
  language: Language;
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
  onNavigateTab: (tab: string) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  user,
  language,
  onLoginSuccess,
  onLogout,
  onNavigateTab,
  initialMode = 'signin'
}) => {
  const t = i18n[language];
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('general');
  const [userLang, setUserLang] = useState<Language>(language);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Form Submission (Sign In or Sign Up) using Supabase Auth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === 'signup') {
        // 1) Supabase Sign Up: supabase.auth.signUp({ email, password })
        const { data: sbData, error: sbError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: name.trim(),
              phone: phone.trim(),
              role: role,
              language: userLang
            }
          }
        });

        if (sbError) {
          setError(sbError.message || 'Error creating account. Please try again.');
          setLoading(false);
          return;
        }

        // Check if a session was immediately created or if email confirmation is required
        if (!sbData?.session) {
          // If data.session is null, do not redirect to dashboard
          setSuccessMsg('Check your email and confirm your account before logging in.');
          setLoading(false);
          return;
        }

        // If a real session exists immediately (e.g. auto-confirm)
        const sbUser = sbData.user || sbData.session.user;
        const loggedInUser: UserAccount = {
          id: sbUser?.id || `sb-${Date.now()}`,
          email: sbUser?.email || email.trim(),
          name: sbUser?.user_metadata?.name || name.trim() || email.split('@')[0],
          role: (sbUser?.user_metadata?.role as UserRole) || role,
          language: (sbUser?.user_metadata?.language as Language) || userLang,
          phone: sbUser?.user_metadata?.phone || phone.trim(),
          savedLocations: [],
          alertPreferences: {
            smsAlerts,
            emailAlerts: true,
            highRiskOnly: false,
            voiceAnnouncements: true
          },
          createdAt: sbUser?.created_at || new Date().toISOString()
        };

        setSuccessMsg('Account created successfully! Redirecting to Home...');
        setTimeout(() => {
          onLoginSuccess(loggedInUser);
          onNavigateTab('dashboard');
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', '/');
          }
        }, 500);
      } else {
        // 2) Supabase Sign In: supabase.auth.signInWithPassword({ email, password })
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (sbError) {
          setError(sbError.message || 'Invalid email or password. Please verify your credentials.');
          setLoading(false);
          return;
        }

        // Only redirect when a real session exists after login
        if (!sbData?.session) {
          setError('No active session found. Please confirm your email before logging in.');
          setLoading(false);
          return;
        }

        const sbUser = sbData.user || sbData.session.user;
        const loggedInUser: UserAccount = {
          id: sbUser?.id || `sb-${Date.now()}`,
          email: sbUser?.email || email.trim(),
          name: sbUser?.user_metadata?.name || email.split('@')[0],
          role: (sbUser?.user_metadata?.role as UserRole) || 'general',
          language: (sbUser?.user_metadata?.language as Language) || userLang || 'en',
          phone: sbUser?.user_metadata?.phone || '',
          savedLocations: [],
          alertPreferences: {
            smsAlerts: true,
            emailAlerts: true,
            highRiskOnly: false,
            voiceAnnouncements: true
          },
          createdAt: sbUser?.created_at || new Date().toISOString()
        };

        setSuccessMsg('Signed in successfully! Redirecting to Home...');
        setTimeout(() => {
          onLoginSuccess(loggedInUser);
          onNavigateTab('dashboard');
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', '/');
          }
        }, 500);
      }
    } catch (err: any) {
      console.error('Supabase Auth error:', err);
      setError(err.message || 'Authentication error. Please try again.');
      setLoading(false);
    }
  };

  // Quick One-Click Demo Profiles for testing
  const handleSelectDemoUser = (demoRole: UserRole, demoName: string, demoEmail: string, demoPhone: string) => {
    const demoAccount: UserAccount = {
      id: `demo-${demoRole}-1`,
      email: demoEmail,
      name: demoName,
      role: demoRole,
      language: demoRole === 'farmer' ? 'te' : demoRole === 'fisherman' ? 'te' : 'en',
      phone: demoPhone,
      savedLocations: [
        {
          id: 'loc-1',
          name: 'Visakhapatnam Coastal Harbor',
          lat: 17.6868,
          lon: 83.2185,
          alertThreshold: 'moderate'
        }
      ],
      alertPreferences: {
        smsAlerts: true,
        emailAlerts: true,
        highRiskOnly: false,
        voiceAnnouncements: true
      },
      createdAt: new Date().toISOString()
    };

    onLoginSuccess(demoAccount);
    onNavigateTab('dashboard');
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/');
    }
  };

  // Log Out Handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout notice:', e);
    }
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout notice:', e);
    }
    onLogout();
    onNavigateTab('dashboard');
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/');
    }
  };

  // Role Option Card Component
  const RoleCard = ({
    value,
    label,
    desc,
    icon: Icon,
    colorClass
  }: {
    value: UserRole;
    label: string;
    desc: string;
    icon: any;
    colorClass: string;
  }) => {
    const isSelected = role === value;
    return (
      <button
        type="button"
        onClick={() => setRole(value)}
        className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
          isSelected
            ? `bg-blue-50 border-blue-600 shadow-sm ring-1 ring-blue-500`
            : 'bg-slate-50/80 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
        }`}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
              {label}
            </p>
            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
          </div>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
            {desc}
          </p>
        </div>
      </button>
    );
  };

  // If user is already signed in, display profile dashboard
  if (user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 border border-blue-600 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 p-0.5 shadow-lg backdrop-blur-sm border border-white/30">
                <div className="w-full h-full bg-blue-900/60 rounded-[14px] flex items-center justify-center text-white font-display font-extrabold text-2xl">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
                    {user.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 capitalize flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-200" />
                    Verified Citizen ({user.role})
                  </span>
                </div>
                <p className="text-xs text-blue-100 font-mono mt-0.5 flex items-center gap-2">
                  <span>{user.email}</span>
                  {user.phone && <span>• {user.phone}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigateTab('vault')}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-blue-200" />
                Disaster Vault
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 border border-rose-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Persona & Early Warning Summary */}
          <div className="bg-white border border-blue-100 rounded-3xl p-6 space-y-4 shadow-md shadow-blue-900/5">
            <div className="flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-sm font-bold text-slate-900">Active Advisory Profile</h3>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5">
                <span className="text-[11px] text-slate-500 block mb-1">Tailored Risk Persona</span>
                <p className="font-bold text-blue-950 capitalize text-sm flex items-center gap-2">
                  {user.role === 'farmer' && '🌾 Farmer (Crop & Rainfall Safeguard)'}
                  {user.role === 'fisherman' && '🎣 Fisherman (Coastal Swell & Sea State)'}
                  {user.role === 'traveler' && '🧳 Commuter / Traveler (Road Hazards)'}
                  {user.role === 'student' && '🎒 Student (Campus & Storm Advisories)'}
                  {user.role === 'general' && '👥 General Citizen (Family Safety & SOS)'}
                </p>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5">
                <span className="text-[11px] text-slate-500 block mb-1">Broadcast Language</span>
                <p className="font-semibold text-slate-800">
                  {user.language === 'te' ? 'తెలుగు (Telugu)' : user.language === 'hi' ? 'हिंदी (Hindi)' : 'English (Primary)'}
                </p>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5">
                <span className="text-[11px] text-slate-500 block mb-1">Emergency SOS Linkage</span>
                <p className="text-emerald-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active (Ready for 1-Click SOS Siren)
                </p>
              </div>
            </div>
          </div>

          {/* Quick Navigations */}
          <div className="md:col-span-2 bg-white border border-blue-100 rounded-3xl p-6 space-y-4 shadow-md shadow-blue-900/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Radio className="w-4 h-4" />
                <h3 className="text-sm font-bold text-slate-900">Disaster Center Access</h3>
              </div>
              <span className="text-[11px] text-slate-500">Core Advisory Services</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <CloudLightning className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-900">Live Weather & Risk Engine</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time IMD & Open-Meteo hazard indicators</p>
              </button>

              <button
                onClick={() => onNavigateTab('letThemKnow')}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Radio className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-teal-900">LetThemKnow Warnings</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Broadcast community alerts for your location</p>
              </button>

              <button
                onClick={() => onNavigateTab('aiChat')}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">AskTheSky AI Voice Advisor</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Telugu, Hindi & English conversational AI</p>
              </button>

              <button
                onClick={() => onNavigateTab('emergency')}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-rose-900">Emergency & Helplines</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">24x7 NDMA, SDRF & local shelter directory</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sign In / Sign Up Form Interface in White & Blue Aesthetic
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Brand Value Proposition & Live Demo Profiles */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 border border-blue-800 rounded-3xl p-6 sm:p-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-blue-100 text-xs font-bold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>SIH 2024 AI Disaster System</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight leading-tight">
              Ask the Sky. <br />
              <span className="text-sky-300">
                Know the Risk.
              </span>{' '}
              Stay Safe.
            </h2>

            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Create your free Citizen Account to receive role-tailored meteorological advisories, store emergency document backups in your secure vault, and broadcast community alerts.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 text-xs text-blue-50">
                <div className="w-6 h-6 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white flex-shrink-0">
                  ✓
                </div>
                <span>Localized alerts for Farmers, Fishermen & Citizens</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-blue-50">
                <div className="w-6 h-6 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white flex-shrink-0">
                  ✓
                </div>
                <span>Encrypted Offline Disaster Vault for insurance & IDs</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-blue-50">
                <div className="w-6 h-6 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white flex-shrink-0">
                  ✓
                </div>
                <span>LetThemKnow crowdsourced warning network</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="border-t border-white/15 pt-5 space-y-2.5 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-sky-300" />
                1-Click Instant Demo Login
              </span>
              <span className="text-[10px] text-blue-200">No password needed</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemoUser('farmer', 'Ramesh Naidu (Farmer)', 'ramesh.farmer@askthesky.ai', '+91 98765 11223')}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 text-left transition-all group"
              >
                <span className="text-base block mb-0.5">🌾</span>
                <p className="text-[11px] font-bold text-white group-hover:text-sky-200 leading-tight">Farmer</p>
                <p className="text-[9px] text-blue-200">Ramesh N.</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemoUser('fisherman', 'Murugan K. (Fisherman)', 'murugan.sea@askthesky.ai', '+91 98765 44556')}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 text-left transition-all group"
              >
                <span className="text-base block mb-0.5">🎣</span>
                <p className="text-[11px] font-bold text-white group-hover:text-sky-200 leading-tight">Fisherman</p>
                <p className="text-[9px] text-blue-200">Murugan K.</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDemoUser('traveler', 'Priya Rao (Commuter)', 'priya.travel@askthesky.ai', '+91 98765 77889')}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 text-left transition-all group"
              >
                <span className="text-base block mb-0.5">🧳</span>
                <p className="text-[11px] font-bold text-white group-hover:text-sky-200 leading-tight">Traveler</p>
                <p className="text-[9px] text-blue-200">Priya Rao</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Main Authentication Form */}
        <div className="lg:col-span-7 bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-900">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              id="auth-tab-signin"
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'signin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account (Sign Up)
            </button>
          </div>

          {/* Error & Success Banners */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-rose-700 text-xs p-3.5 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-blue-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="signup-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Naidu"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Persona Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Your Persona / Activity Role <span className="text-blue-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <RoleCard
                      value="general"
                      label="General Citizen"
                      desc="Family safety & emergency alerts"
                      icon={Users}
                      colorClass="bg-blue-100 text-blue-700 border border-blue-200"
                    />
                    <RoleCard
                      value="farmer"
                      label="Farmer (రైతు / किसान)"
                      desc="Rainfall threshold & crop frost safeguard"
                      icon={Tractor}
                      colorClass="bg-emerald-100 text-emerald-700 border border-emerald-200"
                    />
                    <RoleCard
                      value="fisherman"
                      label="Fisherman (మత్స్యకారుడు)"
                      desc="Sea swell & coastal cyclone tracking"
                      icon={Waves}
                      colorClass="bg-sky-100 text-sky-700 border border-sky-200"
                    />
                    <RoleCard
                      value="traveler"
                      label="Commuter / Traveler"
                      desc="Highway flooding & landslide routes"
                      icon={Compass}
                      colorClass="bg-amber-100 text-amber-700 border border-amber-200"
                    />
                  </div>
                </div>

                {/* Preferred Language & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Language Preference
                    </label>
                    <select
                      id="signup-language"
                      value={userLang}
                      onChange={(e) => setUserLang(e.target.value as Language)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-blue-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="en">English</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number (For SMS SOS)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Create Citizen Account' : 'Sign In to AskTheSky AI'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Footer Hint */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Create Citizen Account
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
