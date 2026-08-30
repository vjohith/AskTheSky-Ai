import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Sun,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Waves,
  Calendar,
  Layers,
  HelpCircle,
  Megaphone
} from 'lucide-react';
import { WeatherData, RiskAssessment, OfficialAlert, Language, UserRole, RiskLevel } from '../types';
import { i18n } from '../i18n';

interface WeatherDashboardProps {
  weather: WeatherData | null;
  risk: RiskAssessment | null;
  alerts: OfficialAlert[];
  language: Language;
  userRole: UserRole;
  onSearchLocation: (query: string) => void;
  onLocateMe: () => void;
  onSelectRole: (role: UserRole) => void;
  loading: boolean;
  onAskAIAboutLocation: () => void;
  onNavigateLetThemKnow?: () => void;
}

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  weather,
  risk,
  alerts,
  language,
  userRole,
  onSearchLocation,
  onLocateMe,
  onSelectRole,
  loading,
  onAskAIAboutLocation,
  onNavigateLetThemKnow
}) => {
  const t = i18n[language];
  const [searchInput, setSearchInput] = useState('');
  const [showExplainModal, setShowExplainModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchLocation(searchInput.trim());
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'severe':
        return { text: t.riskLevels.severe, bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50', border: 'border-rose-600', fill: 'bg-rose-600' };
      case 'high':
        return { text: t.riskLevels.high, bg: 'bg-red-500/15 text-red-400 border-red-500/40', border: 'border-red-500', fill: 'bg-red-500' };
      case 'moderate':
        return { text: t.riskLevels.moderate, bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40', border: 'border-amber-500', fill: 'bg-amber-500' };
      case 'low':
      default:
        return { text: t.riskLevels.low, bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', border: 'border-emerald-500', fill: 'bg-emerald-500' };
    }
  };

  const currentRiskBadge = risk ? getRiskBadge(risk.level) : getRiskBadge('low');

  return (
    <div className="space-y-6">
      {/* Search & Location Bar */}
      <div className="bg-[#0c1633]/90 border border-blue-900/60 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
            <input
              id="search-location-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.dashboard.searchPlaceholder}
              className="w-full bg-[#081026] border border-blue-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-400 transition-colors shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="search-btn"
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-900/40 disabled:opacity-50 border border-blue-400/30 cursor-pointer"
            >
              {loading ? 'Analyzing...' : 'Analyze Weather & Risk'}
            </button>
            <button
              id="gps-locate-btn"
              type="button"
              onClick={onLocateMe}
              title={t.dashboard.locateMe}
              className="bg-[#081026] hover:bg-blue-900/40 text-sky-400 border border-blue-800/60 p-2.5 rounded-xl transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick Location Pills */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto text-xs text-blue-300/80 pt-1 border-t border-blue-900/40">
          <span className="shrink-0 text-blue-200 font-medium">Quick Radar:</span>
          {['Visakhapatnam', 'Vijayawada', 'Hyderabad', 'Mumbai', 'Chennai', 'Puri', 'Delhi', 'Kolkata'].map((city) => (
            <button
              key={city}
              id={`quick-city-${city.toLowerCase()}`}
              onClick={() => onSearchLocation(city)}
              className="shrink-0 bg-[#081026] hover:bg-blue-900/50 text-blue-100 hover:text-white border border-blue-800/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Data Source Transparency Bar */}
      {weather && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0c1633]/70 border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-blue-200/80">
          <div className="flex items-center gap-2">
            <span className="text-blue-300 font-medium">{t.dashboard.dataSource}:</span>
            {weather.dataSource === 'live_open_meteo' ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t.dashboard.liveOpenMeteo}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-950/70 text-amber-300 border border-amber-700/60 px-2.5 py-0.5 rounded-full font-medium">
                <Info className="w-3 h-3 text-amber-400" />
                {t.dashboard.simulatedFallback}
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-blue-900/60 text-sky-200 border border-blue-700/50 px-2.5 py-0.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3 text-sky-400" />
              Gemini 3.7 AI Ready
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-blue-200">
              Station: <strong className="text-white">{weather.locationName}</strong>
            </span>
            <span className="text-blue-300">
              Coordinates: <span className="font-mono text-sky-400">{weather.lat.toFixed(2)}°N, {weather.lon.toFixed(2)}°E</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Meteorological & Risk Grid */}
      {weather && risk && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Primary Weather Condition & Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Real-time Hero Weather Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1633] via-[#0d1c44] to-[#070e24] border border-blue-900/70 rounded-3xl p-6 sm:p-8 shadow-2xl">
              {/* Subtle Atmospheric Gradient Glow */}
              <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none ${
                risk.level === 'severe' ? 'bg-rose-500' : risk.level === 'high' ? 'bg-red-500' : risk.level === 'moderate' ? 'bg-amber-500' : 'bg-blue-500'
              }`} />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-sky-400 text-sm font-medium mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>{weather.locationName}</span>
                    <span className="text-blue-300/70">• Updated {new Date(weather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-baseline gap-4 mt-2">
                    <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white font-mono font-display">
                      {weather.temperature}°C
                    </span>
                    <div className="text-blue-200 text-sm">
                      <p>{t.dashboard.feelsLike}: <span className="text-white font-semibold">{weather.feelsLike}°C</span></p>
                      <p>Min: <span className="text-sky-300 font-medium">{weather.tempMin}°C</span> | Max: <span className="text-rose-300 font-medium">{weather.tempMax}°C</span></p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-3 flex items-center gap-2 font-display">
                    {weather.weatherDescription}
                  </h3>
                </div>

                {/* Weather Action / AI Advisory Trigger */}
                <div className="bg-[#081026]/90 border border-blue-800/60 rounded-2xl p-4 flex flex-col gap-3 min-w-[240px] shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-200 font-medium">Risk Assessment</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase ${currentRiskBadge.bg}`}>
                      {risk.level}
                    </span>
                  </div>
                  <div className="w-full bg-[#0c1633] h-2.5 rounded-full overflow-hidden border border-blue-900/60">
                    <div
                      className={`h-full transition-all duration-1000 ${currentRiskBadge.fill}`}
                      style={{ width: `${risk.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-100 line-clamp-2">
                    {risk.primaryThreat}
                  </p>
                  <button
                    id="ask-ai-advisory-btn"
                    onClick={onAskAIAboutLocation}
                    className="w-full mt-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-950/50 cursor-pointer border border-blue-400/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI Detailed Advisory</span>
                  </button>
                </div>
              </div>

              {/* 8-Grid Core Weather Parameter Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-blue-900/60">
                <div className="bg-[#081026]/80 border border-blue-800/60 rounded-2xl p-3 shadow-inner">
                  <div className="flex items-center gap-2 text-blue-200 text-xs mb-1">
                    <Droplets className="w-4 h-4 text-sky-400" />
                    <span>{t.dashboard.rainAmount}</span>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">{weather.precipitation} mm</p>
                  <span className="text-[10px] text-blue-300/80">{weather.precipitationProbability}% prob</span>
                </div>

                <div className="bg-[#081026]/80 border border-blue-800/60 rounded-2xl p-3 shadow-inner">
                  <div className="flex items-center gap-2 text-blue-200 text-xs mb-1">
                    <Wind className="w-4 h-4 text-sky-400" />
                    <span>{t.dashboard.windSpeed}</span>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">{weather.windSpeed} km/h</p>
                  <span className="text-[10px] text-blue-300/80">Gusts: {weather.windGusts} km/h</span>
                </div>

                <div className="bg-[#081026]/80 border border-blue-800/60 rounded-2xl p-3 shadow-inner">
                  <div className="flex items-center gap-2 text-blue-200 text-xs mb-1">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    <span>{t.dashboard.humidity}</span>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">{weather.humidity}%</p>
                  <span className="text-[10px] text-blue-300/80">Pressure: {weather.pressure} hPa</span>
                </div>

                <div className="bg-[#081026]/80 border border-blue-800/60 rounded-2xl p-3 shadow-inner">
                  <div className="flex items-center gap-2 text-blue-200 text-xs mb-1">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>{t.dashboard.uvIndex}</span>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">{weather.uvIndex}</p>
                  <span className="text-[10px] text-blue-300/80">Air AQI: {weather.aqi || 55}</span>
                </div>
              </div>
            </div>

            {/* Explainable AI Risk Breakdown Card */}
            <div className="bg-[#0c1633]/90 border border-blue-900/60 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-700/60 flex items-center justify-center shadow-inner">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display">{t.dashboard.explainableAI}</h3>
                    <p className="text-xs text-blue-300/80">Multi-parameter physical formula breakdown</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-sky-200 bg-blue-950/80 border border-blue-700/60 px-3 py-1 rounded-full">
                  Risk Score: {risk.score} / 100
                </span>
              </div>

              {/* Summary explanation text */}
              <div className="bg-[#081026]/90 border border-blue-900/50 rounded-2xl p-4 text-xs text-blue-100 leading-relaxed shadow-inner">
                <p>{risk.explainableAI}</p>
              </div>

              {/* Factors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {risk.factors.map((factor, idx) => (
                  <div key={idx} className="bg-[#081026]/80 border border-blue-900/50 rounded-xl p-3 flex flex-col justify-between shadow-inner">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{factor.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        factor.impact === 'severe' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        factor.impact === 'high' ? 'bg-red-950 text-red-300 border border-red-800' :
                        factor.impact === 'moderate' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {factor.impact}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-sky-400 font-medium mb-1">{factor.value}</p>
                    <p className="text-[11px] text-blue-200/80">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Precipitation & Forecast */}
            <div className="bg-[#0c1633]/90 border border-blue-900/60 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 font-display">
                <Clock className="w-4 h-4 text-sky-400" />
                {t.dashboard.hourlyForecast}
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {weather.hourly.time.slice(0, 12).map((timeStr, idx) => {
                  const hour = new Date(timeStr).getHours();
                  const temp = weather.hourly.temperature[idx];
                  const rain = weather.hourly.precipitation[idx];
                  const wind = weather.hourly.windSpeed[idx];
                  return (
                    <div
                      key={idx}
                      className="shrink-0 w-20 bg-[#081026] border border-blue-900/60 rounded-2xl p-3 text-center flex flex-col items-center justify-between gap-1 shadow-inner"
                    >
                      <span className="text-xs text-blue-300 font-mono">
                        {hour}:00
                      </span>
                      <span className="text-sm font-bold text-white font-mono">
                        {temp}°C
                      </span>
                      <div className="my-1 flex items-center gap-1 text-[11px] text-sky-400 font-mono">
                        <Droplets className="w-3 h-3" />
                        <span>{rain}mm</span>
                      </div>
                      <span className="text-[10px] text-blue-300/80 font-mono">
                        {wind}km/h
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Col 3: Role Advice, Active Alerts & 7-Day Timeline */}
          <div className="space-y-6">
            {/* Tailored Role Advice Card */}
            <div className="bg-gradient-to-br from-[#0c1633] via-[#0d1c44] to-[#0a1535] border border-blue-900/60 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
                    {t.dashboard.personalizedAdvice}
                  </span>
                  <h3 className="text-base font-bold text-white capitalize font-display">
                    {t.roles[userRole]}
                  </h3>
                </div>

                {/* Role Switcher Mini Pills */}
                <div className="flex items-center gap-1 bg-[#081026] border border-blue-900/60 p-1 rounded-xl shadow-inner">
                  {(['farmer', 'fisherman', 'traveler', 'student', 'general'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      id={`dashboard-role-btn-${r}`}
                      onClick={() => onSelectRole(r)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        userRole === r ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-300 hover:text-white'
                      }`}
                      title={t.roles[r]}
                    >
                      {r === 'farmer' ? '🌾' : r === 'fisherman' ? '🎣' : r === 'traveler' ? '🧳' : r === 'student' ? '🎒' : '👥'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advisory Points */}
              <div className="space-y-2.5">
                {(risk.roleSpecificAdvice[userRole] || risk.roleSpecificAdvice.general).map((advice, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 bg-[#081026]/90 border border-blue-900/50 rounded-xl p-3 text-xs text-blue-100 leading-relaxed shadow-inner">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>{advice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Official Alerts Panel */}
            <div className="bg-[#0c1633]/90 border border-blue-900/60 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  {t.dashboard.activeAlerts}
                </h3>
                <span className="text-xs font-mono bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded-full">
                  {alerts.length} Active
                </span>
              </div>

              {/* LetThemKnow Quick Community Broadcast Banner */}
              {onNavigateLetThemKnow && (
                <div className="mb-4 bg-gradient-to-r from-teal-950/90 via-[#0a202c]/80 to-[#081026] border border-teal-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-teal-900/80 border border-teal-500/50 flex items-center justify-center text-teal-300 flex-shrink-0">
                      <Megaphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-teal-200">
                        Witnessing severe disaster conditions here?
                      </p>
                      <p className="text-[11px] text-blue-200/90">
                        Post an instant warning to alert nearby citizens & farmers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onNavigateLetThemKnow}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    LetThemKnow →
                  </button>
                </div>
              )}

              {alerts.length > 0 ? (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-[#081026] border border-red-900/50 rounded-2xl p-4 space-y-2 shadow-inner"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-blue-300">{alert.issuedTime}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white font-display">{alert.title}</h4>
                      <p className="text-[11px] text-blue-100 leading-relaxed">{alert.description}</p>
                      <div className="pt-2 border-t border-blue-900/40">
                        <span className="text-[10px] text-blue-300 font-medium">Official Directives:</span>
                        <ul className="mt-1 space-y-1 text-[11px] text-blue-200 list-disc list-inside">
                          {alert.instructions.slice(0, 2).map((ins, i) => (
                            <li key={i}>{ins}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-[10px] text-sky-400/80 pt-1">
                        Source: {alert.issuedBy} • Area: {alert.affectedArea}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#081026]/70 border border-blue-900/50 rounded-2xl p-6 text-center text-xs text-blue-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  No severe disaster warnings currently active for this district.
                </div>
              )}
            </div>

            {/* 7-Day Risk & Weather Timeline */}
            <div className="bg-[#0c1633]/90 border border-blue-900/60 rounded-3xl p-6 shadow-xl backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 font-display">
                <Calendar className="w-4 h-4 text-sky-400" />
                {t.dashboard.sevenDayForecast}
              </h3>

              <div className="space-y-2">
                {weather.daily.time.map((dayStr, idx) => {
                  const dayName = idx === 0 ? 'Today' : new Date(dayStr).toLocaleDateString('en-US', { weekday: 'short' });
                  const maxT = weather.daily.tempMax[idx];
                  const minT = weather.daily.tempMin[idx];
                  const rain = weather.daily.precipitationSum[idx];
                  const dayRisk = weather.daily.riskLevels[idx];
                  const riskPill = getRiskBadge(dayRisk);

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#081026]/80 border border-blue-900/50 rounded-xl px-3 py-2 text-xs shadow-inner"
                    >
                      <span className="w-14 font-semibold text-white">{dayName}</span>
                      <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[11px]">
                        <Droplets className="w-3 h-3" />
                        <span>{rain}mm</span>
                      </div>
                      <div className="font-mono text-blue-200">
                        <span className="text-rose-300 font-medium">{maxT}°</span> / <span className="text-sky-300 font-medium">{minT}°</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${riskPill.bg}`}>
                        {dayRisk}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
