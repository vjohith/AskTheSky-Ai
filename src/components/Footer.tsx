import React from 'react';
import { CloudLightning, Heart, Shield, Radio, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { i18n } from '../i18n';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = i18n[language];

  return (
    <footer className="bg-[#0c1633]/90 border-t border-blue-900/60 text-blue-200/80 text-xs mt-16 py-10 px-4 sm:px-6 lg:px-8 shadow-2xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-blue-900/50">
          {/* Brand & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 border border-blue-400/30">
              <CloudLightning className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm font-display">AskTheSky AI</span>
                <span className="bg-blue-900/70 text-blue-200 border border-blue-700/60 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
                  SIH Project
                </span>
              </div>
              <p className="text-[11px] text-blue-300/80">{t.tagline}</p>
            </div>
          </div>

          {/* Developer Credit Requirement */}
          <div className="bg-[#081026] border border-blue-800/60 rounded-2xl px-5 py-3 text-center shadow-inner">
            <span className="text-[11px] text-blue-300/90 block font-medium">
              National AI & Disaster Resilience Innovation
            </span>
            <div className="text-sm font-extrabold text-white flex items-center justify-center gap-1.5 mt-0.5 font-display">
              <span className="bg-gradient-to-r from-blue-200 via-white to-sky-300 bg-clip-text text-transparent">Developed by Team SynapX</span>
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </div>
          </div>
        </div>

        {/* Informational Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-[11px] text-blue-200/80">
          <div>
            <span className="font-bold text-white block mb-2 text-xs font-display">Data Sources</span>
            <ul className="space-y-1 text-blue-200/90">
              <li>• Real-Time Open-Meteo High-Resolution APIs</li>
              <li>• India Meteorological Department (IMD) Bulletins</li>
              <li>• INCOIS Ocean State & Swell Warnings</li>
              <li>• NDMA Disaster SOP Knowledge Corpus</li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-white block mb-2 text-xs font-display">AI & Risk Architecture</span>
            <ul className="space-y-1 text-blue-200/90">
              <li>• Gemini 3.7 Flash Model</li>
              <li>• Multi-Factor Explainable Risk Engine</li>
              <li>• Multilingual Speech Recognition & Synthesis</li>
              <li>• Tailored Personas (Farmers, Fishers, Travelers)</li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-white block mb-2 text-xs font-display">Emergency Helplines</span>
            <ul className="space-y-1 text-blue-200/90">
              <li>• National Emergency: 112</li>
              <li>• NDRF Disaster Control: 1078</li>
              <li>• Ambulance Service: 108</li>
              <li>• Coast Guard Maritime: 1554</li>
            </ul>
          </div>

          <div>
            <span className="font-bold text-white block mb-2 text-xs font-display">Motto & Vision</span>
            <p className="text-blue-200/90 leading-relaxed">
              "Ask the Sky. Know the Risk. Stay Safe." Empowering every Indian citizen with proactive, understandable, and life-saving meteorological intelligence.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-4 border-t border-blue-900/50 text-center text-[10px] text-blue-300/60 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© AskTheSky AI • SIH Project</span>
          <span className="text-sky-400 font-semibold">Proudly Engineered by Team SynapX</span>
        </div>
      </div>
    </footer>
  );
};
