import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Wind,
  Search,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { MapMarkerLocation, HazardLayerData, Language, RiskLevel } from '../types';
import { i18n } from '../i18n';

interface InteractiveRiskMapProps {
  markers: MapMarkerLocation[];
  hazardLayers: HazardLayerData | null;
  selectedLocation: MapMarkerLocation | null;
  onSelectLocation: (loc: MapMarkerLocation) => void;
  language: Language;
  onGenerateAdvisory: (locationName: string) => void;
  centerLat?: number;
  centerLon?: number;
}

export const InteractiveRiskMap: React.FC<InteractiveRiskMapProps> = ({
  markers,
  hazardLayers,
  selectedLocation,
  onSelectLocation,
  language,
  onGenerateAdvisory,
  centerLat = 17.6868,
  centerLon = 83.2185
}) => {
  const t = i18n[language];
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const hazardGroupRef = useRef<L.LayerGroup | null>(null);

  // Toggleable hazard layers
  const [showCyclones, setShowCyclones] = useState(true);
  const [showFloods, setShowFloods] = useState(true);
  const [showHeavyRain, setShowHeavyRain] = useState(true);
  const [showHeatwaves, setShowHeatwaves] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create custom marker icons for Leaflet (Red, Yellow, Green)
  const createMarkerIcon = (risk: RiskLevel, name: string) => {
    let colorClass = 'bg-emerald-500 shadow-emerald-500/50 border-emerald-300';
    let pingColor = 'bg-emerald-400';
    let label = '🟢';

    if (risk === 'severe') {
      colorClass = 'bg-rose-600 shadow-rose-600/80 border-rose-300 animate-pulse';
      pingColor = 'bg-rose-500';
      label = '🚨';
    } else if (risk === 'high') {
      colorClass = 'bg-red-500 shadow-red-500/80 border-red-200 animate-bounce';
      pingColor = 'bg-red-400';
      label = '🔴';
    } else if (risk === 'moderate') {
      colorClass = 'bg-amber-500 shadow-amber-500/60 border-amber-200';
      pingColor = 'bg-amber-400';
      label = '🟡';
    }

    const html = `
      <div class="relative flex items-center justify-center cursor-pointer group">
        <span class="absolute w-8 h-8 rounded-full ${pingColor} opacity-40 animate-ping"></span>
        <div class="relative w-7 h-7 rounded-full ${colorClass} border-2 flex items-center justify-center text-xs shadow-xl text-white font-bold transition-transform group-hover:scale-125">
          ${label}
        </div>
        <div class="absolute -bottom-6 whitespace-nowrap bg-slate-950/90 text-slate-100 border border-slate-700 text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none font-semibold">
          ${name}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-risk-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLon],
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true
      });

      // CartoDB Dark Matter tile layer for a sleek dark radar look
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | OpenStreetMap',
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(map);

      markerGroupRef.current = L.layerGroup().addTo(map);
      hazardGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep instance or destroy on unmount
    };
  }, []);

  // Update Markers & Centering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markerGroupRef.current) return;

    markerGroupRef.current.clearLayers();

    markers.forEach((loc) => {
      const icon = createMarkerIcon(loc.riskLevel, loc.name);
      const marker = L.marker([loc.lat, loc.lon], { icon }).addTo(markerGroupRef.current!);

      marker.on('click', () => {
        onSelectLocation(loc);
      });
    });
  }, [markers, onSelectLocation]);

  // Render Hazard Layers (Polygons & Polylines)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hazardGroupRef.current || !hazardLayers) return;

    hazardGroupRef.current.clearLayers();

    // 1. Cyclone Trajectory Tracks
    if (showCyclones && hazardLayers.cyclonePaths) {
      hazardLayers.cyclonePaths.forEach((track) => {
        const polyline = L.polyline(track.points, {
          color: '#ef4444',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.9
        }).addTo(hazardGroupRef.current!);

        polyline.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
            <strong style="color: #dc2626;">🌀 ${track.name}</strong><br/>
            <span>Category: ${track.category}</span><br/>
            <span>Max Winds: ${track.windSpeedKnots} Knots</span><br/>
            <em>${track.projectedLandfall}</em>
          </div>
        `);
      });
    }

    // 2. Flood Prone Zones
    if (showFloods && hazardLayers.floodZones) {
      hazardLayers.floodZones.forEach((zone) => {
        const polygon = L.polygon(zone.polygon, {
          color: '#3b82f6',
          fillColor: '#60a5fa',
          fillOpacity: 0.35,
          weight: 2
        }).addTo(hazardGroupRef.current!);

        polygon.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
            <strong style="color: #2563eb;">🌊 ${zone.name}</strong><br/>
            <span>Basin: ${zone.riverBasin}</span><br/>
            <span style="color: #dc2626; font-weight: bold;">Risk Level: HIGH FLOOD VULNERABILITY</span>
          </div>
        `);
      });
    }

    // 3. Heavy Rain Zones
    if (showHeavyRain && hazardLayers.heavyRainZones) {
      hazardLayers.heavyRainZones.forEach((zone) => {
        const polygon = L.polygon(zone.polygon, {
          color: '#06b6d4',
          fillColor: '#22d3ee',
          fillOpacity: 0.25,
          weight: 2,
          dashArray: '4, 4'
        }).addTo(hazardGroupRef.current!);

        polygon.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
            <strong style="color: #0891b2;">🌧️ ${zone.regionName}</strong><br/>
            <span>Rainfall Forecast: ${zone.rainfallForecastMm} mm/24h</span>
          </div>
        `);
      });
    }

    // 4. Heatwave Corridors
    if (showHeatwaves && hazardLayers.heatwaveZones) {
      hazardLayers.heatwaveZones.forEach((zone) => {
        const polygon = L.polygon(zone.polygon, {
          color: '#f59e0b',
          fillColor: '#fbbf24',
          fillOpacity: 0.25,
          weight: 2
        }).addTo(hazardGroupRef.current!);

        polygon.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
            <strong style="color: #d97706;">☀️ ${zone.regionName}</strong><br/>
            <span>Max Expected Temp: ${zone.maxTemp}°C</span>
          </div>
        `);
      });
    }
  }, [hazardLayers, showCyclones, showFloods, showHeavyRain, showHeatwaves]);

  // Pan to selected location
  useEffect(() => {
    if (selectedLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedLocation.lat, selectedLocation.lon], 8, { duration: 1.2 });
    }
  }, [selectedLocation]);

  const handleSearchMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = markers.find(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.state.toLowerCase().includes(searchQuery.toLowerCase()));
    if (match) {
      onSelectLocation(match);
    }
  };

  return (
    <div className="space-y-6">
      {/* Map Control Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            {t.map.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.map.clickPrompt}</p>
        </div>

        {/* Hazard Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowCyclones(!showCyclones)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showCyclones ? 'bg-rose-950/80 border-rose-700 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span>🌀</span>
            <span>{t.map.layers.cyclones}</span>
          </button>
          <button
            onClick={() => setShowFloods(!showFloods)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showFloods ? 'bg-blue-950/80 border-blue-700 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span>🌊</span>
            <span>{t.map.layers.floods}</span>
          </button>
          <button
            onClick={() => setShowHeavyRain(!showHeavyRain)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showHeavyRain ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span>🌧️</span>
            <span>{t.map.layers.heavyRain}</span>
          </button>
          <button
            onClick={() => setShowHeatwaves(!showHeatwaves)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showHeatwaves ? 'bg-amber-950/80 border-amber-700 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <span>☀️</span>
            <span>{t.map.layers.heatwaves}</span>
          </button>
        </div>
      </div>

      {/* Map + Detail Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map Stage */}
        <div className="lg:col-span-2 relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[580px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Risk Legend Card */}
          <div className="absolute top-4 right-4 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 text-[11px] text-slate-300 shadow-xl space-y-1.5 max-w-[210px]">
            <span className="font-bold text-slate-100 block text-xs border-b border-slate-800 pb-1">
              {t.map.legendTitle}
            </span>
            <div className="flex items-center gap-2 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>{t.map.redMarker}</span>
            </div>
            <div className="flex items-center gap-2 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>{t.map.yellowMarker}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{t.map.greenMarker}</span>
            </div>
          </div>

          {/* Quick Marker Jump Buttons */}
          <div className="absolute bottom-4 left-4 right-4 z-10 overflow-x-auto flex gap-2 pb-1">
            {markers.map((loc) => (
              <button
                key={loc.id}
                onClick={() => onSelectLocation(loc)}
                className={`shrink-0 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-lg backdrop-blur-md transition-all flex items-center gap-1.5 ${
                  selectedLocation?.id === loc.id
                    ? 'bg-cyan-600 text-white border-cyan-400 ring-2 ring-cyan-500/50'
                    : 'bg-slate-950/90 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <span>{loc.riskLevel === 'severe' ? '🚨' : loc.riskLevel === 'high' ? '🔴' : loc.riskLevel === 'moderate' ? '🟡' : '🟢'}</span>
                <span>{loc.name}</span>
                <span className="font-mono text-[10px] text-cyan-300">{loc.temperature}°C</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Location Inspection Panel */}
        <div className="space-y-4">
          {selectedLocation ? (
            <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    {t.map.selectedLocation}
                  </span>
                  <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    {selectedLocation.name}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedLocation.state}, India</p>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full border font-bold uppercase ${
                    selectedLocation.riskLevel === 'severe'
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : selectedLocation.riskLevel === 'high'
                      ? 'bg-red-950 text-red-300 border-red-700'
                      : selectedLocation.riskLevel === 'moderate'
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  }`}
                >
                  {selectedLocation.riskLevel} RISK
                </span>
              </div>

              {/* Weather Stats Row */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400">Temperature</span>
                  <p className="text-sm font-bold text-slate-100 font-mono">{selectedLocation.temperature}°C</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Rainfall</span>
                  <p className="text-sm font-bold text-blue-400 font-mono">{selectedLocation.rainfall} mm</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Wind Speed</span>
                  <p className="text-sm font-bold text-cyan-400 font-mono">{selectedLocation.windSpeed} km/h</p>
                </div>
              </div>

              {/* Threat Headline */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Primary Threat Reason:
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {selectedLocation.primaryRiskReason}
                </p>
              </div>

              {/* Safety Actions */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 text-cyan-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.map.safetyActions}:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedLocation.recommendedAction}
                </p>
              </div>

              {/* Active Alerts Count */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Active Disaster Warnings:</span>
                <span className="font-bold text-rose-400">{selectedLocation.activeAlertCount} Warnings</span>
              </div>

              {/* Generate Full AI Advisory Button */}
              <button
                id="map-advisory-btn"
                onClick={() => onGenerateAdvisory(selectedLocation.name)}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-cyan-950/60 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.map.viewFullAdvisory}</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-3">
              <MapPin className="w-8 h-8 text-cyan-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-200">Select any Pin on the Map</h4>
              <p className="text-xs text-slate-400">
                Click any red, yellow, or green location pin on the map to inspect real-time weather parameters and active disaster warnings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
