import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, ShieldCheck, Sparkles, CheckCircle2, AlertTriangle, Eye, EyeOff, Maximize2 } from 'lucide-react';
import { UserAccount, Language, UserRole } from '../types';
import { i18n } from '../i18n';
import { supabase } from '../supabaseClient';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  language: Language;
  onOpenFullPage?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onLoginSuccess,
  language,
  onOpenFullPage
}) => {
  const t = i18n[language];
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('general');
  const [userLang, setUserLang] = useState<Language>(language);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (isRegister && !name.trim()) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }
    if (isRegister && password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // 1) Supabase Sign Up: supabase.auth.signUp({ email, password })
        const { data: sbData, error: sbError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: name.trim(),
              phone: phone.trim(),
              role,
              language: userLang
            }
          }
        });

        if (sbError) {
          setError(sbError.message || 'Error creating account');
          setLoading(false);
          return;
        }

        // If data.session is null, don't redirect to dashboard; show confirm message
        if (!sbData?.session) {
          setSuccessMsg('Check your email and confirm your account before logging in.');
          setLoading(false);
          return;
        }

        const sbUser = sbData.user || sbData.session.user;
        const loggedUser: UserAccount = {
          id: sbUser?.id || `sb-${Date.now()}`,
          email: sbUser?.email || email.trim(),
          name: sbUser?.user_metadata?.name || name.trim() || email.split('@')[0],
          role: (sbUser?.user_metadata?.role as UserRole) || role,
          language: (sbUser?.user_metadata?.language as Language) || userLang,
          phone: sbUser?.user_metadata?.phone || phone.trim(),
          savedLocations: [],
          alertPreferences: { smsAlerts: true, emailAlerts: true, highRiskOnly: false, voiceAnnouncements: true },
          createdAt: sbUser?.created_at || new Date().toISOString()
        };

        onLoginSuccess(loggedUser);
        onClose();
        if (typeof window !== 'undefined' && window.history) {
          window.history.pushState({}, '', '/');
        }
      } else {
        // 2) Supabase Sign In: supabase.auth.signInWithPassword({ email, password })
        const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (sbError) {
          setError(sbError.message || 'Invalid email or password');
          setLoading(false);
          return;
        }

        if (!sbData?.session) {
          setError('No active session found. Please confirm your email before logging in.');
          setLoading(false);
          return;
        }

        const sbUser = sbData.user || sbData.session.user;
        const loggedUser: UserAccount = {
          id: sbUser?.id || `sb-${Date.now()}`,
          email: sbUser?.email || email.trim(),
          name: sbUser?.user_metadata?.name || email.split('@')[0],
          role: (sbUser?.user_metadata?.role as UserRole) || 'general',
          language: (sbUser?.user_metadata?.language as Language) || userLang || 'en',
          phone: sbUser?.user_metadata?.phone || '',
          savedLocations: [],
          alertPreferences: { smsAlerts: true, emailAlerts: true, highRiskOnly: false, voiceAnnouncements: true },
          createdAt: sbUser?.created_at || new Date().toISOString()
        };

        onLoginSuccess(loggedUser);
        onClose();
        if (typeof window !== 'undefined' && window.history) {
          window.history.pushState({}, '', '/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoUser = (demoRole: UserRole, demoName: string, demoEmail: string) => {
    onLoginSuccess({
      id: `demo-${demoRole}-1`,
      email: demoEmail,
      name: demoName,
      role: demoRole,
      language: demoRole === 'farmer' ? 'te' : 'en',
      phone: '+91 98765 43210',
      savedLocations: [
        {
          id: 'loc-1',
          name: 'Visakhapatnam Harbor',
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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c1633] border border-blue-900/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-white relative">
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-700/60 flex items-center justify-center shadow-inner">
              <User className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display">
                {user ? 'Citizen Account Profile' : isRegister ? 'Create Citizen Account' : 'Sign In to AskTheSky AI'}
              </h3>
              <p className="text-[11px] text-blue-300/80">Secure Disaster Vault & Early Warnings</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-300 hover:text-white p-1 cursor-pointer transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-800 text-rose-300 text-xs p-3 rounded-2xl flex items-start gap-2 shadow-inner">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-2xl flex items-start gap-2 shadow-inner">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {user ? (
          <div className="space-y-4 text-xs">
            <div className="bg-[#081026] border border-blue-900/60 rounded-2xl p-4 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-blue-300/80 text-[11px]">Full Name:</span>
                  <p className="font-bold text-white text-sm font-display">{user.name}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900/80 text-sky-200 border border-blue-700/60 capitalize">
                  {user.role}
                </span>
              </div>
              <div>
                <span className="text-blue-300/80 text-[11px]">Email Address:</span>
                <p className="font-mono text-sky-400">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <span className="text-blue-300/80 text-[11px]">Emergency Contact:</span>
                  <p className="font-mono text-blue-200">{user.phone}</p>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-950/50 border border-blue-400/30"
            >
              Continue to Application
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-semibold text-blue-200 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Naidu"
                    className="w-full bg-[#081026] border border-blue-800/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 shadow-inner"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-blue-200 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-[#081026] border border-blue-800/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-blue-200 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#081026] border border-blue-800/60 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-blue-200 mb-1">Select Persona</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#081026] border border-blue-800/60 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer shadow-inner"
                  >
                    <option value="general">👥 General Citizen</option>
                    <option value="farmer">🌾 Farmer</option>
                    <option value="fisherman">🎣 Fisherman</option>
                    <option value="traveler">🧳 Traveler</option>
                    <option value="student">🎒 Student</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-blue-200 mb-1">Language</label>
                  <select
                    value={userLang}
                    onChange={(e) => setUserLang(e.target.value as Language)}
                    className="w-full bg-[#081026] border border-blue-800/60 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-blue-400 cursor-pointer shadow-inner"
                  >
                    <option value="en">English</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-950/50 text-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 border border-blue-400/30 font-display"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Citizen Account' : 'Sign In'}
            </button>

            <div className="pt-2 border-t border-blue-900/60 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sky-400 hover:text-sky-300 hover:underline font-medium cursor-pointer"
              >
                {isRegister ? 'Already have account? Sign In' : 'New citizen? Create Account'}
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoUser('farmer', 'Ramesh Naidu (Farmer)', 'ramesh.farmer@askthesky.ai')}
                className="text-blue-300 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3 text-sky-400" />
                1-Click Demo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
