import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  X,
  Volume2,
  VolumeX,
  MapPin,
  Radio,
  Copy,
  Check,
  AlertTriangle,
  Send
} from 'lucide-react';
import { Language } from '../types';
import { i18n } from '../i18n';

interface EmergencyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  lat: number;
  lon: number;
  locationName: string;
  onDispatchSOS: (hazard: string, msg: string) => Promise<boolean>;
}

export const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({
  isOpen,
  onClose,
  language,
  lat,
  lon,
  locationName,
  onDispatchSOS
}) => {
  const t = i18n[language];
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Siren Sound Generator using Web Audio API
  useEffect(() => {
    if (!isOpen) {
      if (audioCtx) {
        audioCtx.close();
        setAudioCtx(null);
      }
      setSirenPlaying(false);
      return;
    }
  }, [isOpen]);

  const toggleSiren = () => {
    if (sirenPlaying) {
      if (audioCtx) {
        audioCtx.close();
        setAudioCtx(null);
      }
      setSirenPlaying(false);
    } else {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        
        // Modulate frequency like emergency siren
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(200, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        lfo.start();

        setAudioCtx(ctx);
        setSirenPlaying(true);
      } catch (e) {
        console.warn('Audio siren not allowed without interaction', e);
      }
    }
  };

  const copyCoordinates = () => {
    const text = `EMERGENCY LOCATION: ${locationName} (Coordinates: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleQuickSOS = async () => {
    const success = await onDispatchSOS('CRITICAL HIGH-PRIORITY EVACUATION SOS', 'Immediate life-safety rescue required at given GPS coordinates.');
    if (success) setSosSent(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      {/* High Alert Container */}
      <div className="relative w-full max-w-2xl bg-slate-950 border-2 border-red-500 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950 space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-red-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center animate-bounce shadow-lg shadow-red-900">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block">
                NATIONAL DISASTER RESPONSE PROTOCOL
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                HIGH URGENCY EMERGENCY MODE
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl"
            title="Dismiss Emergency Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Siren & GPS Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Siren Button */}
          <button
            onClick={toggleSiren}
            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${
              sirenPlaying
                ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-lg'
                : 'bg-slate-900 border-slate-700 text-red-400 hover:bg-slate-800'
            }`}
          >
            {sirenPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{sirenPlaying ? 'Mute Alert Sound Tone' : 'Play Audible Emergency Tone'}</span>
          </button>

          {/* GPS Copy */}
          <button
            onClick={copyCoordinates}
            className="p-3 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-2xl flex items-center justify-center gap-2 text-xs font-mono text-cyan-300 transition-all"
          >
            <MapPin className="w-4 h-4 text-red-400" />
            <span className="truncate">{lat.toFixed(2)}°N, {lon.toFixed(2)}°E</span>
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Instant 1-Click Dial Grid */}
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Instant 1-Click Helplines (Direct Line):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href="tel:112"
              className="bg-red-600 hover:bg-red-500 text-white font-bold p-3 rounded-2xl text-center shadow-md transition-transform hover:scale-105 flex flex-col items-center justify-center"
            >
              <span className="text-[10px] uppercase opacity-80">All-India Emergency</span>
              <span className="text-lg font-mono">📞 112</span>
            </a>
            <a
              href="tel:1078"
              className="bg-rose-700 hover:bg-rose-600 text-white font-bold p-3 rounded-2xl text-center shadow-md transition-transform hover:scale-105 flex flex-col items-center justify-center"
            >
              <span className="text-[10px] uppercase opacity-80">NDRF Control</span>
              <span className="text-lg font-mono">📞 1078</span>
            </a>
            <a
              href="tel:108"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold p-3 rounded-2xl text-center shadow-md transition-transform hover:scale-105 flex flex-col items-center justify-center"
            >
              <span className="text-[10px] uppercase text-slate-400">Ambulance</span>
              <span className="text-lg font-mono text-cyan-400">📞 108</span>
            </a>
            <a
              href="tel:1554"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold p-3 rounded-2xl text-center shadow-md transition-transform hover:scale-105 flex flex-col items-center justify-center"
            >
              <span className="text-[10px] uppercase text-slate-400">Coast Guard</span>
              <span className="text-lg font-mono text-amber-400">📞 1554</span>
            </a>
          </div>
        </div>

        {/* SOS One-Tap Dispatch */}
        <div className="bg-red-950/60 border border-red-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-rose-300 block">
              {sosSent ? '✓ SOS DISPATCHED TO NDRF CONTROL' : 'One-Tap Urgent Distress Dispatch'}
            </span>
            <p className="text-[11px] text-slate-400">
              Sends your exact GPS location ({locationName}) to emergency responders.
            </p>
          </div>

          <button
            onClick={handleQuickSOS}
            disabled={sosSent}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{sosSent ? 'Transmitted' : 'Dispatch Distress Signal'}</span>
          </button>
        </div>

        {/* Offline Evacuation Essentials Checklist */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Critical Evacuation & Safety Directives:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              ⚡ <strong>Power Off:</strong> Disconnect main circuit breaker and gas cylinder valves immediately.
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              🌊 <strong>Move Higher:</strong> If water rises, seek multi-story reinforced shelters or high ground.
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              🎒 <strong>Go-Bag:</strong> Carry drinking water, waterproof ID pouch, torch, and power bank.
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
              🚫 <strong>No Wading:</strong> Never drive or walk through flood waters or near downed powerlines.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
