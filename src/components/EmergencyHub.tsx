import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  ShieldAlert,
  Hospital,
  Building2,
  Flame,
  LifeBuoy,
  MapPin,
  Send,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Info,
  Clock,
  Search,
  Radio
} from 'lucide-react';
import { EmergencyContact, EmergencyFacility, SurvivalGuide, Language, SOSAlert } from '../types';
import { i18n } from '../i18n';

interface EmergencyHubProps {
  language: Language;
  currentLat?: number;
  currentLon?: number;
  currentLocationName?: string;
  onDispatchSOS: (hazardType: string, msg: string) => Promise<boolean>;
}

export const EmergencyHub: React.FC<EmergencyHubProps> = ({
  language,
  currentLat,
  currentLon,
  currentLocationName = 'Current Location',
  onDispatchSOS
}) => {
  const t = i18n[language];
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [guides, setGuides] = useState<SurvivalGuide[]>([]);
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [selectedGuideId, setSelectedGuideId] = useState<string>('cyclone');
  const [sosSent, setSosSent] = useState(false);
  const [sosHazard, setSosHazard] = useState('Severe Cyclone / Flood Inundation');
  const [sosMessage, setSosMessage] = useState('Urgent evacuation and medical rescue assistance requested.');
  const [sendingSos, setSendingSos] = useState(false);

  useEffect(() => {
    // Fetch contacts
    fetch('/api/emergency/contacts')
      .then(res => res.json())
      .then(data => {
        if (data.contacts) setContacts(data.contacts);
      })
      .catch(err => console.warn(err));

    // Fetch facilities
    const url = `/api/emergency/facilities?lat=${currentLat || 17.6868}&lon=${currentLon || 83.2185}&type=${facilityFilter}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.facilities) setFacilities(data.facilities);
      })
      .catch(err => console.warn(err));

    // Fetch guides
    fetch('/api/emergency/guides')
      .then(res => res.json())
      .then(data => {
        if (data.guides) setGuides(data.guides);
      })
      .catch(err => console.warn(err));
  }, [currentLat, currentLon, facilityFilter]);

  const handleSOSSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingSos(true);
    const success = await onDispatchSOS(sosHazard, sosMessage);
    setSendingSos(false);
    if (success) {
      setSosSent(true);
    }
  };

  const selectedGuide = guides.find(g => g.id === selectedGuideId) || guides[0];

  return (
    <div className="space-y-8">
      {/* Emergency Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-rose-950 border border-red-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>National Disaster Management & Relief Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t.emergency.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {t.emergency.subtitle}
            </p>
          </div>

          <div className="bg-slate-950/80 border border-red-900/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <div className="text-xs">
              <span className="text-slate-400 block">Emergency Control Line</span>
              <strong className="text-rose-400 font-mono text-base">NDRF: 1078 | All-India: 112</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 24x7 Helpline Direct Click-to-Call Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-cyan-400" />
          {t.emergency.helplineTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {contacts.map((c) => (
            <a
              key={c.id}
              href={`tel:${c.number}`}
              className="group bg-slate-950/80 hover:bg-red-950/40 border border-slate-800 hover:border-red-600/50 rounded-2xl p-4 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-100 group-hover:text-rose-300">{c.name}</span>
                <span className="text-[10px] bg-slate-900 text-slate-400 group-hover:text-rose-400 px-2 py-0.5 rounded-full font-mono">
                  {c.available}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">{c.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-sm font-bold font-mono text-rose-400 group-hover:text-rose-300">
                  📞 {c.number}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold group-hover:underline">
                  {t.emergency.callNow} →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* SOS Signal Dispatcher & Facilities Finder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Instant SOS Dispatcher */}
        <div className="bg-slate-900/90 border border-red-900/40 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-950 border border-red-800 flex items-center justify-center">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.emergency.sosTitle}</h3>
              <p className="text-xs text-slate-400">{t.emergency.sosDesc}</p>
            </div>
          </div>

          {sosSent ? (
            <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-2xl p-4 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                {t.emergency.sosDispatched}
              </h4>
              <p className="text-[11px] text-slate-300">
                Telemetry transmitted to local SDRF & NDRF emergency dispatch. Keep your phone line clear.
              </p>
              <button
                onClick={() => setSosSent(false)}
                className="mt-2 text-xs text-cyan-400 underline font-medium"
              >
                Send New Update
              </button>
            </div>
          ) : (
            <form onSubmit={handleSOSSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                  Identified Emergency Type
                </label>
                <select
                  value={sosHazard}
                  onChange={(e) => setSosHazard(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                >
                  <option>Severe Cyclone / Storm Surge</option>
                  <option>Flash Flood / Inundation Trapped</option>
                  <option>Landslide Road Blockage</option>
                  <option>Medical Crisis / Boat Distress</option>
                  <option>Heatstroke / Dehydration Collapse</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                  Distress Message & Specific Needs
                </label>
                <textarea
                  rows={3}
                  value={sosMessage}
                  onChange={(e) => setSosMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                  placeholder="State number of people trapped, landmarks, or medical urgency..."
                />
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-400 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">GPS: {currentLocationName}</span>
              </div>

              <button
                id="dispatch-sos-btn"
                type="submit"
                disabled={sendingSos}
                className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-red-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sendingSos ? 'Transmitting to Control Room...' : t.emergency.broadcastSOS}</span>
              </button>
            </form>
          )}
        </div>

        {/* Col 2 & 3: Nearby Emergency Facilities Finder */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Hospital className="w-4 h-4 text-cyan-400" />
                {t.emergency.facilitiesTitle}
              </h3>
              <p className="text-xs text-slate-400">{t.emergency.facilitiesDesc}</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'hospital', label: 'Hospitals' },
                { id: 'shelter', label: 'Cyclone Shelters' },
                { id: 'police', label: 'Police' },
                { id: 'fire', label: 'Fire' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFacilityFilter(f.id)}
                  className={`px-3 py-1 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors ${
                    facilityFilter === f.id
                      ? 'bg-cyan-600 border-cyan-400 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Facilities List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {facilities.map((fac) => (
              <div
                key={fac.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-100">{fac.name}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                      fac.type === 'hospital' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      fac.type === 'shelter' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      'bg-slate-900 text-slate-300 border border-slate-700'
                    }`}>
                      {fac.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{fac.address}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono font-semibold">
                      📍 {fac.distanceKm ? `${fac.distanceKm} km away` : 'Nearby'}
                    </span>
                    {fac.capacity && (
                      <span className="text-[10px] text-slate-400">Cap: {fac.capacity}</span>
                    )}
                  </div>
                  <a
                    href={`tel:${fac.phone}`}
                    className="text-xs text-rose-400 hover:text-rose-300 font-mono font-bold"
                  >
                    📞 {fac.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offline First-Aid & Survival Protocol Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              {t.emergency.survivalGuidesTitle}
            </h3>
            <p className="text-xs text-slate-400">{t.emergency.survivalGuidesDesc}</p>
          </div>

          {/* Guide Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {guides.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGuideId(g.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedGuide?.id === g.id
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {g.hazard}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Guide Details */}
        {selectedGuide && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h4 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                <span>🛡️</span>
                <span>{selectedGuide.hazard} Emergency Standard Operating Procedure</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">{selectedGuide.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Before Phase */}
              <div className="bg-slate-900/80 border border-amber-900/30 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  1. Before (Preparation)
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedGuide.before.map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* During Phase */}
              <div className="bg-slate-900/80 border border-red-900/40 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                  2. During (Active Impact)
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedGuide.during.map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* After Phase */}
              <div className="bg-slate-900/80 border border-emerald-900/30 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  3. After (Recovery & Safety)
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedGuide.after.map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* First Aid Box */}
            <div className="bg-slate-900/90 border border-cyan-900/40 rounded-2xl p-4">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <LifeBuoy className="w-4 h-4 text-cyan-400" />
                First-Aid Kit & Critical Survival Essentials
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedGuide.firstAid.map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-950 text-slate-200 border border-slate-700/80 px-3 py-1 rounded-xl"
                  >
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
