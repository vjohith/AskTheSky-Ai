import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  MapPin,
  AlertTriangle,
  Send,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Search,
  PlusCircle,
  ShieldCheck,
  Radio,
  Flame,
  Waves,
  CloudRain,
  Wind,
  Zap,
  Activity,
  User,
  CheckCircle2,
  Navigation,
  Sparkles,
  Info
} from 'lucide-react';
import { CommunityReport, Language, UserRole } from '../types';
import { i18n } from '../i18n';
import {
  loadCommunityReports,
  createCommunityReport,
  voteOnReport
} from '../lib/supabaseService';

interface LetThemKnowProps {
  language: Language;
  userRole: UserRole;
  currentLocationName: string;
  currentLat: number;
  currentLon: number;
  userName?: string;
  onSelectLocationForWeather?: (locName: string, lat?: number, lon?: number) => void;
}

export const LetThemKnow: React.FC<LetThemKnowProps> = ({
  language,
  userRole,
  currentLocationName,
  currentLat,
  currentLon,
  userName = 'Citizen Contributor',
  onSelectLocationForWeather
}) => {
  const t = i18n[language];
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hazardFilter, setHazardFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Form State
  const [formLocation, setFormLocation] = useState(currentLocationName || '');
  const [formLat, setFormLat] = useState<number | undefined>(currentLat);
  const [formLon, setFormLon] = useState<number | undefined>(currentLon);
  const [formTitle, setFormTitle] = useState('');
  const [formHazardType, setFormHazardType] = useState<CommunityReport['hazardType']>('heavy_rain');
  const [formSeverity, setFormSeverity] = useState<CommunityReport['severity']>('caution');
  const [formSuggestion, setFormSuggestion] = useState('');
  const [formSafetyAdvice, setFormSafetyAdvice] = useState('');
  const [formAuthorRole, setFormAuthorRole] = useState<UserRole>(userRole);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await loadCommunityReports(hazardFilter, searchQuery);
      setReports(data);
    } catch (e) {
      console.error('Error fetching community reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [hazardFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleUseCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormLat(pos.coords.latitude);
          setFormLon(pos.coords.longitude);
          setFormLocation(currentLocationName || `GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
        },
        (err) => {
          console.warn('GPS fetch failed', err);
          setFormLocation(currentLocationName);
        }
      );
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLocation || !formTitle || !formSuggestion) {
      alert('Please provide your location, title, and alert suggestion.');
      return;
    }

    setSubmitting(true);
    try {
      const newReport = await createCommunityReport({
        userName,
        userRole: formAuthorRole,
        location: formLocation,
        lat: formLat,
        lon: formLon,
        hazardType: formHazardType,
        severity: formSeverity,
        title: formTitle,
        suggestion: formSuggestion,
        safetyAdvice: formSafetyAdvice || 'Please exercise extreme caution and share this warning with nearby residents.'
      });

      if (newReport) {
        setSuccessToast('Your disaster alert & safety suggestion was published to all citizens!');
        setShowForm(false);
        // Reset form
        setFormTitle('');
        setFormSuggestion('');
        setFormSafetyAdvice('');
        fetchReports();
        setTimeout(() => setSuccessToast(''), 6000);
      } else {
        alert('Could not post report');
      }
    } catch (err) {
      console.error('Error creating report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (reportId: string, type: 'up' | 'down') => {
    try {
      const success = await voteOnReport(reportId, type);
      if (success) {
        setReports(prev =>
          prev.map(r => {
            if (r.id === reportId) {
              const prevVoted = r.userVoted;
              let newUp = r.upvotes;
              let newDown = r.downvotes;

              if (prevVoted === type) {
                // unvote
                if (type === 'up') newUp = Math.max(0, newUp - 1);
                else newDown = Math.max(0, newDown - 1);
                return { ...r, upvotes: newUp, downvotes: newDown, userVoted: undefined };
              } else {
                if (prevVoted === 'up') newUp = Math.max(0, newUp - 1);
                if (prevVoted === 'down') newDown = Math.max(0, newDown - 1);
                if (type === 'up') newUp += 1;
                else newDown += 1;
                return { ...r, upvotes: newUp, downvotes: newDown, userVoted: type };
              }
            }
            return r;
          })
        );
      }
    } catch (e) {
      console.error('Vote error:', e);
    }
  };

  const getHazardIcon = (type: string) => {
    switch (type) {
      case 'flood':
      case 'high_waves':
        return <Waves className="w-4 h-4 text-cyan-400" />;
      case 'cyclone':
      case 'wind':
        return <Wind className="w-4 h-4 text-sky-400" />;
      case 'heavy_rain':
        return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'lightning':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'heatwave':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'landslide':
      case 'road_blocked':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return (
          <span className="bg-red-950/90 text-rose-300 border border-red-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            CRITICAL DANGER
          </span>
        );
      case 'danger':
        return (
          <span className="bg-rose-950/70 text-rose-300 border border-rose-800/50 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            DANGER ALERT
          </span>
        );
      case 'caution':
      default:
        return (
          <span className="bg-amber-950/70 text-amber-300 border border-amber-800/50 text-[11px] font-medium px-2 py-0.5 rounded-full">
            CAUTION ADVISED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Pop-out CTA */}
      <div className="bg-gradient-to-r from-[#0c1633] via-blue-950/70 to-[#0c1633] border border-blue-800/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-700/60 flex items-center justify-center shadow-md">
                <Megaphone className="w-4 h-4 text-sky-400" />
              </div>
              <span className="bg-blue-950/90 text-sky-300 border border-blue-750 text-[11px] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider font-semibold">
                Citizen Crowdsourced Watch
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              LetThemKnow — <span className="bg-gradient-to-r from-sky-400 via-blue-200 to-indigo-300 bg-clip-text text-transparent">Ground-Level Disaster Alerts</span>
            </h1>
            
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Are you witnessing waterlogging, road blockages, extreme winds, or flash flooding in your area? Broadcast quick suggestions with your location to protect fellow citizens, farmers, and commuters.
            </p>
          </div>

          <button
            id="btn-post-suggestion"
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-950/60 border border-blue-400/30 transition-all duration-200 transform hover:-translate-y-1 hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer font-display"
          >
            <PlusCircle className="w-5 h-5" />
            <span>{showForm ? 'Close Alert Form' : '+ Let Them Know (Add Alert)'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="bg-teal-950/90 border border-teal-600/70 text-teal-200 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
          <p className="text-xs font-semibold">{successToast}</p>
        </div>
      )}

      {/* Interactive Submission Form (Pops out when toggled) */}
      {showForm && (
        <div className="bg-[#0c1633] border border-blue-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 transition-all duration-300 animate-scale-up text-white">
          <div className="flex items-center justify-between border-b border-blue-900/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-700/60 flex items-center justify-center">
                <Radio className="w-4 h-4 text-sky-400" />
              </div>
              <h2 className="text-lg font-bold text-white font-display">
                Post Quick Disaster Advisory & Suggestion
              </h2>
            </div>
            <span className="text-[11px] text-blue-300/80">
              Posting as: <strong className="text-sky-400">{userName}</strong>
            </span>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Input with GPS Quick-Fill */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-blue-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    Exact Area / Landmark Location *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentGPS}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    Use Current GPS
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="e.g., MVP Colony Sector 4, Visakhapatnam / NH-16 Bridge"
                  className="w-full bg-[#081026] border border-blue-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 shadow-inner"
                />
              </div>

              {/* Hazard Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-blue-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Hazard / Threat Type *
                </label>
                <select
                  value={formHazardType}
                  onChange={(e) => setFormHazardType(e.target.value as any)}
                  className="w-full bg-[#081026] border border-blue-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400 shadow-inner cursor-pointer"
                >
                  <option value="heavy_rain">🌧️ Heavy Rainfall & Waterlogging</option>
                  <option value="flood">🌊 Flash Flood / River Inundation</option>
                  <option value="high_waves">🌊 Coastal Swell / Sea Waves</option>
                  <option value="cyclone">🌀 Cyclone Gale / Tree Fall</option>
                  <option value="landslide">⛰️ Landslide / Rockfall</option>
                  <option value="lightning">⚡ Thunderstorm & Lightning Hazard</option>
                  <option value="heatwave">☀️ Severe Heatwave Exceeding 43°C</option>
                  <option value="road_blocked">🚧 Road / Underpass Inundated & Blocked</option>
                  <option value="power_outage">🔌 Power Outage & Downed Electric Poles</option>
                  <option value="other">⚠️ Other Severe Weather Threat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Severity Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-blue-200">
                  Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormSeverity('caution')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formSeverity === 'caution'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-[#081026] border-blue-900/60 text-blue-300/70 hover:border-blue-700'
                    }`}
                  >
                    🟡 Caution
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSeverity('danger')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formSeverity === 'danger'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-[#081026] border-blue-900/60 text-blue-300/70 hover:border-blue-700'
                    }`}
                  >
                    🔴 Danger
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSeverity('emergency')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formSeverity === 'emergency'
                        ? 'bg-red-950 border-red-500 text-red-200 shadow-sm ring-1 ring-red-500'
                        : 'bg-[#081026] border-blue-900/60 text-blue-300/70 hover:border-blue-700'
                    }`}
                  >
                    🚨 Emergency
                  </button>
                </div>
              </div>

              {/* Persona perspective */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-blue-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  Reporting Perspective / Role
                </label>
                <select
                  value={formAuthorRole}
                  onChange={(e) => setFormAuthorRole(e.target.value as UserRole)}
                  className="w-full bg-[#081026] border border-blue-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400 shadow-inner cursor-pointer"
                >
                  <option value="general">👥 Local Resident / General Citizen</option>
                  <option value="farmer">🌾 Farmer / Agri Observer</option>
                  <option value="fisherman">🎣 Fisherman / Coastal Resident</option>
                  <option value="traveler">🧳 Commuter / Highway Traveler</option>
                  <option value="student">🎒 Student / Youth Volunteer</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-200">
                Headline / Short Alert Title *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Underpass flooded with 3 feet water; small cars getting stuck"
                className="w-full bg-[#081026] border border-blue-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 shadow-inner"
              />
            </div>

            {/* Quick Suggestion */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-200">
                Ground Observation & Quick Suggestion for Citizens *
              </label>
              <textarea
                required
                rows={3}
                value={formSuggestion}
                onChange={(e) => setFormSuggestion(e.target.value)}
                placeholder="Explain what is happening right now and how people in this area should protect themselves (e.g., Take Flyover Route instead of lower road; do not park vehicles near old banyan trees)."
                className="w-full bg-[#081026] border border-blue-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 shadow-inner resize-none"
              />
            </div>

            {/* Safety Advice */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-200">
                Recommended Precaution (Do's & Don'ts)
              </label>
              <input
                type="text"
                value={formSafetyAdvice}
                onChange={(e) => setFormSafetyAdvice(e.target.value)}
                placeholder="e.g., Avoid 2-wheelers on this route; keep emergency power banks charged."
                className="w-full bg-[#081026] border border-blue-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 shadow-inner"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-blue-300/80 hover:text-white hover:bg-blue-900/40 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-950/50 border border-blue-400/30 transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer font-display"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Broadcasting Alert...' : 'Broadcast to Citizens'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-[#0c1633] border border-blue-900/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by city, area, or landmark..."
            className="w-full bg-[#081026] border border-blue-900/60 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 shadow-inner"
          />
          <Search className="w-4 h-4 text-blue-300/60 absolute left-3 top-2.5" />
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Hazards' },
            { id: 'flood', label: '🌊 Floods' },
            { id: 'high_waves', label: '🌊 Coastal Swell' },
            { id: 'cyclone', label: '🌀 Cyclones' },
            { id: 'heavy_rain', label: '🌧️ Heavy Rain' },
            { id: 'landslide', label: '⛰️ Landslides' },
            { id: 'heatwave', label: '☀️ Heatwaves' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setHazardFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 transform hover:-translate-y-0.5 cursor-pointer ${
                hazardFilter === cat.id
                  ? 'bg-blue-600 text-white border border-blue-400/40 shadow-sm'
                  : 'bg-[#081026] text-blue-300/70 hover:text-white border border-blue-900/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white font-display">
              Live Ground Reports & Warnings ({reports.length})
            </h3>
          </div>
          <span className="text-[11px] text-blue-300/80">
            Real-time citizen alerts verified by upvotes
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-[#0c1633]/60 border border-blue-900/50 rounded-3xl space-y-3">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-blue-300/70">Loading ground disaster advisories...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-[#0c1633]/40 border border-blue-900/50 rounded-3xl space-y-3 p-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-800/60 flex items-center justify-center mx-auto text-sky-400 shadow-inner">
              <Megaphone className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white font-display">No Citizen Reports Found</h4>
            <p className="text-xs text-blue-200/80 max-w-md mx-auto">
              Be the first to post a quick safety suggestion or alert for your neighborhood to help others stay safe.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-transform transform hover:scale-105 cursor-pointer shadow-md"
            >
              + Post First Suggestion
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-[#0c1633] border border-blue-900/60 hover:border-blue-700/80 rounded-3xl p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/40 flex flex-col justify-between space-y-4 group shadow-md"
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-7 h-7 rounded-lg bg-[#081026] border border-blue-800/60 flex items-center justify-center shadow-inner">
                        {getHazardIcon(rep.hazardType)}
                      </div>
                      {getSeverityBadge(rep.severity)}
                      <span className="text-[11px] text-blue-300/70 font-mono">
                        {new Date(rep.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(rep.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-[#081026] px-2 py-0.5 rounded-lg border border-blue-900/60 text-[10px] text-emerald-400 font-mono shadow-inner">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Citizen Verified</span>
                    </div>
                  </div>

                  {/* Location & Title */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 mb-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{rep.location}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors leading-snug font-display">
                      {rep.title}
                    </h4>
                  </div>

                  {/* Suggestion & Description */}
                  <div className="bg-[#081026] border border-blue-900/50 rounded-2xl p-3.5 space-y-2 shadow-inner">
                    <div className="text-xs text-blue-100/90 leading-relaxed">
                      <strong className="text-sky-300 block mb-1 text-[11px] uppercase tracking-wide">
                        💡 Citizen Suggestion & Warning:
                      </strong>
                      {rep.suggestion}
                    </div>

                    {rep.safetyAdvice && (
                      <div className="text-[11px] text-amber-200 bg-amber-950/40 border border-amber-900/50 p-2 rounded-xl flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{rep.safetyAdvice}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls & Upvoting */}
                <div className="pt-2 border-t border-blue-900/60 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-blue-300/80">
                    <span className="w-5 h-5 rounded-full bg-blue-900/80 flex items-center justify-center font-bold text-[10px] text-white">
                      {rep.userName.charAt(0)}
                    </span>
                    <span className="font-medium text-white truncate max-w-[120px]">
                      {rep.userName}
                    </span>
                    {rep.userRole && (
                      <span className="capitalize text-blue-300/60 text-[10px]">
                        ({rep.userRole})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectLocationForWeather && (
                      <button
                        onClick={() => onSelectLocationForWeather(rep.location, rep.lat, rep.lon)}
                        className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline px-2 py-1 bg-blue-950/80 border border-blue-800/60 rounded-lg transition-transform hover:scale-105 cursor-pointer"
                        title="Check live weather radar for this location"
                      >
                        Check Radar →
                      </button>
                    )}

                    {/* Upvote Pill */}
                    <div className="flex items-center gap-1 bg-[#081026] border border-blue-900/60 rounded-xl px-1.5 py-0.5 shadow-inner">
                      <button
                        onClick={() => handleVote(rep.id, 'up')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          rep.userVoted === 'up'
                            ? 'text-sky-400 bg-blue-950/80'
                            : 'text-blue-300/70 hover:text-white'
                        }`}
                        title="Upvote: Helpful Alert"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono font-bold text-white px-1">
                        {rep.upvotes - rep.downvotes}
                      </span>
                      <button
                        onClick={() => handleVote(rep.id, 'down')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          rep.userVoted === 'down'
                            ? 'text-rose-400 bg-rose-950/80'
                            : 'text-blue-300/70 hover:text-white'
                        }`}
                        title="Downvote: Inaccurate Alert"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
