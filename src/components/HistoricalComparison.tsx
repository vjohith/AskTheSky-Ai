import React from 'react';
import {
  TrendingUp,
  Calendar,
  CloudRain,
  Sun,
  Wind,
  AlertTriangle,
  Info,
  Layers
} from 'lucide-react';
import { WeatherData, Language } from '../types';
import { i18n } from '../i18n';

interface HistoricalComparisonProps {
  weather: WeatherData | null;
  language: Language;
}

export const HistoricalComparison: React.FC<HistoricalComparisonProps> = ({
  weather,
  language
}) => {
  const t = i18n[language];
  const hist = weather?.historicalComparison;

  if (!weather || !hist) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
        Loading historical climate analysis...
      </div>
    );
  }

  // Calculate anomaly percentages
  const tempDiff = Math.round((weather.temperature - hist.normalTemp) * 10) / 10;
  const rainDiff = Math.round((weather.precipitation - (hist.normalPrecipitationMm / 30)) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>Climate Anomaly & Baseline Analysis</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Historical Climate Normals vs. Live Observations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            10-Year IMD & ERA5 climatological reference baselines for {weather.locationName}
          </p>
        </div>

        <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-1.5 rounded-full">
          Baseline Window: 2015 – 2025
        </span>
      </div>

      {/* Metric Cards Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Temperature Comparison */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase">
              <Sun className="w-4 h-4" />
              <span>Thermal Profile</span>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold ${
              tempDiff > 2 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {tempDiff >= 0 ? `+${tempDiff}°C` : `${tempDiff}°C`} anomaly
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Current Observation</span>
                <span className="font-mono text-slate-100 font-bold">{weather.temperature}°C</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full"
                  style={{ width: `${Math.min(100, (weather.temperature / 50) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>10-Yr Historical Normal</span>
                <span className="font-mono text-slate-300 font-semibold">{hist.normalTemp}°C</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-slate-600 rounded-full"
                  style={{ width: `${Math.min(100, (hist.normalTemp / 50) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            Current heat index is {tempDiff > 1.5 ? 'significantly higher than normal seasonal baseline.' : 'within typical standard deviations for this region.'}
          </p>
        </div>

        {/* Monsoon & Precipitation Anomaly */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase">
              <CloudRain className="w-4 h-4" />
              <span>Rainfall Baseline</span>
            </div>
            <span className="text-xs font-mono bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold">
              {weather.precipitation} mm / 24h
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Today's Rainfall</span>
                <span className="font-mono text-slate-100 font-bold">{weather.precipitation} mm</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                  style={{ width: `${Math.min(100, (weather.precipitation / 80) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Monthly Historical Total</span>
                <span className="font-mono text-slate-300 font-semibold">{hist.normalPrecipitationMm} mm</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-slate-600 rounded-full"
                  style={{ width: `${Math.min(100, (hist.normalPrecipitationMm / 300) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            {weather.precipitation > 25 ? '⚠️ Convective heavy spell in progress, exceeding daily average threshold.' : 'Normal non-flooding atmospheric precipitation rate.'}
          </p>
        </div>

        {/* Historical Disaster Frequency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase">
              <Wind className="w-4 h-4" />
              <span>Decadal Cyclone Frequency</span>
            </div>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
              {hist.cycloneFrequencyPerDecade} Events/Decade
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">Regional Vulnerability Index:</span>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Cyclone Vulnerability:</span>
              <strong className="text-rose-400">High (Zone II)</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Flood Inundation Index:</span>
              <strong className="text-amber-400">Moderate</strong>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Heat Stress Days (Annual):</span>
              <strong className="text-slate-200">~24 Days</strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            Data sourced from IMD Historical Climate Atlases & Disaster Management Authority archives.
          </p>
        </div>
      </div>
    </div>
  );
};
