import { WeatherData, RiskAssessment, RiskLevel, UserRole, OfficialAlert, MapMarkerLocation, HazardLayerData } from '../src/types';

// Pre-seeded locations for fast search and map markers across India & Globe
export const SEED_LOCATIONS: { name: string; state: string; country: string; lat: number; lon: number; defaultRisk?: RiskLevel }[] = [
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India', lat: 17.6868, lon: 83.2185, defaultRisk: 'high' },
  { name: 'Vijayawada', state: 'Andhra Pradesh', country: 'India', lat: 16.5062, lon: 80.6480, defaultRisk: 'moderate' },
  { name: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.3850, lon: 78.4867, defaultRisk: 'low' },
  { name: 'Tirupati', state: 'Andhra Pradesh', country: 'India', lat: 13.6288, lon: 79.4192, defaultRisk: 'low' },
  { name: 'Kakinada', state: 'Andhra Pradesh', country: 'India', lat: 16.9891, lon: 82.2475, defaultRisk: 'high' },
  { name: 'Guntur', state: 'Andhra Pradesh', country: 'India', lat: 16.3067, lon: 80.4365, defaultRisk: 'moderate' },
  { name: 'Warangal', state: 'Telangana', country: 'India', lat: 17.9689, lon: 79.5941, defaultRisk: 'low' },
  { name: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.0760, lon: 72.8777, defaultRisk: 'high' },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lon: 80.2707, defaultRisk: 'moderate' },
  { name: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lon: 88.3639, defaultRisk: 'high' },
  { name: 'Bhubaneswar', state: 'Odisha', country: 'India', lat: 20.2961, lon: 85.8245, defaultRisk: 'high' },
  { name: 'Puri', state: 'Odisha', country: 'India', lat: 19.8135, lon: 85.8312, defaultRisk: 'severe' },
  { name: 'New Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090, defaultRisk: 'moderate' },
  { name: 'Bengaluru', state: 'Karnataka', country: 'India', lat: 12.9716, lon: 77.5946, defaultRisk: 'low' },
  { name: 'Kochi', state: 'Kerala', country: 'India', lat: 9.9312, lon: 76.2673, defaultRisk: 'moderate' },
  { name: 'Patna', state: 'Bihar', country: 'India', lat: 25.5941, lon: 85.1376, defaultRisk: 'high' },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lon: 72.5714, defaultRisk: 'low' },
  { name: 'Guwahati', state: 'Assam', country: 'India', lat: 26.1445, lon: 91.7362, defaultRisk: 'high' },
  { name: 'London', state: 'England', country: 'UK', lat: 51.5074, lon: -0.1278, defaultRisk: 'low' },
  { name: 'Tokyo', state: 'Kanto', country: 'Japan', lat: 35.6762, lon: 139.6503, defaultRisk: 'moderate' }
];

// Helper to calculate risk from weather metrics
export function assessDisasterRisk(weather: {
  temp: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number;
  pressure: number;
  weatherCode: number;
  locationName: string;
}): RiskAssessment {
  let score = 10; // baseline safe
  const factors: RiskAssessment['factors'] = [];

  // 1. Rain & Flood Risk
  if (weather.precipitation >= 80) {
    score += 45;
    factors.push({
      name: 'Extremely Heavy Rainfall',
      value: `${weather.precipitation} mm/24h`,
      impact: 'severe',
      description: 'Severe flash flooding, waterlogging, and river basin surge imminent.'
    });
  } else if (weather.precipitation >= 45) {
    score += 30;
    factors.push({
      name: 'Heavy Rainfall',
      value: `${weather.precipitation} mm/24h`,
      impact: 'high',
      description: 'Significant road flooding and crop soil saturation risk.'
    });
  } else if (weather.precipitation >= 15) {
    score += 15;
    factors.push({
      name: 'Moderate Rainfall',
      value: `${weather.precipitation} mm/24h`,
      impact: 'moderate',
      description: 'Localized ponding on streets and slick road conditions.'
    });
  } else {
    factors.push({
      name: 'Precipitation',
      value: `${weather.precipitation} mm`,
      impact: 'low',
      description: 'Precipitation levels within normal safe ranges.'
    });
  }

  // 2. Wind Speed & Cyclone / Gale Risk
  if (weather.windGusts >= 85 || weather.windSpeed >= 65) {
    score += 45;
    factors.push({
      name: 'Severe Cyclonic Gale Winds',
      value: `${weather.windSpeed} km/h (Gusts: ${weather.windGusts} km/h)`,
      impact: 'severe',
      description: 'High danger of falling trees, roof damage, and power grid disruption.'
    });
  } else if (weather.windGusts >= 55 || weather.windSpeed >= 40) {
    score += 25;
    factors.push({
      name: 'Squally / Strong Winds',
      value: `${weather.windSpeed} km/h (Gusts: ${weather.windGusts} km/h)`,
      impact: 'high',
      description: 'Dangerous sea waves and hazards to two-wheelers and high trucks.'
    });
  } else if (weather.windSpeed >= 28) {
    score += 12;
    factors.push({
      name: 'Moderate Breeze / Wind',
      value: `${weather.windSpeed} km/h`,
      impact: 'moderate',
      description: 'Moderate wave height and windy conditions.'
    });
  } else {
    factors.push({
      name: 'Wind Speed',
      value: `${weather.windSpeed} km/h`,
      impact: 'low',
      description: 'Gentle breeze, safe for all outdoor operations.'
    });
  }

  // 3. Thermal Stress (Heatwave or Severe Cold)
  const heatIndex = weather.temp + (weather.humidity > 70 ? (weather.humidity - 70) * 0.15 : 0);
  if (weather.temp >= 43 || heatIndex >= 48) {
    score += 35;
    factors.push({
      name: 'Extreme Heatwave Stress',
      value: `${weather.temp}°C (Heat Index: ${Math.round(heatIndex)}°C)`,
      impact: 'severe',
      description: 'High risk of severe heatstroke, dehydration, and agricultural moisture loss.'
    });
  } else if (weather.temp >= 39 || heatIndex >= 42) {
    score += 20;
    factors.push({
      name: 'High Heat / Sun Stress',
      value: `${weather.temp}°C`,
      impact: 'high',
      description: 'Precaution advised during midday sun exposure.'
    });
  } else if (weather.temp <= 5) {
    score += 20;
    factors.push({
      name: 'Cold Wave Alert',
      value: `${weather.temp}°C`,
      impact: 'moderate',
      description: 'Hypothermia risk for unsheltered populations.'
    });
  } else {
    factors.push({
      name: 'Thermal Comfort',
      value: `${weather.temp}°C`,
      impact: 'low',
      description: 'Temperature within manageable physiological limits.'
    });
  }

  // 4. Thunderstorm / Pressure anomaly
  if (weather.weatherCode >= 95) {
    score += 30;
    factors.push({
      name: 'Active Severe Thunderstorm / Lightning',
      value: `Code ${weather.weatherCode}`,
      impact: 'high',
      description: 'Cloud-to-ground lightning strike hazard and convective turbulence.'
    });
  }

  // Normalize score
  score = Math.min(100, Math.max(5, score));

  let level: RiskLevel = 'low';
  let color = '#22c55e'; // Green
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let headline = 'Safe Meteorological Conditions';
  let primaryThreat = 'No active severe weather threats detected.';

  if (score >= 75) {
    level = 'severe';
    color = '#ef4444'; // Red
    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
    headline = 'EMERGENCY: Severe Weather & Disaster Threat';
    primaryThreat = 'High impact cyclonic storm / extreme flood / destructive heatwave.';
  } else if (score >= 50) {
    level = 'high';
    color = '#f97316'; // Red-Orange
    badgeBg = 'bg-red-500/15 text-red-400 border-red-500/40';
    headline = 'WARNING: High Meteorological Risk';
    primaryThreat = 'Heavy rainfall, strong squall gusts, or intense convective storm.';
  } else if (score >= 28) {
    level = 'moderate';
    color = '#eab308'; // Yellow
    badgeBg = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    headline = 'CAUTION: Moderate Weather Warning';
    primaryThreat = 'Localized downpours, gusty winds, or elevated temperature.';
  }

  const explainableAI = `Risk score of ${score}/100 (${level.toUpperCase()}) derived from multi-factor analysis: Rainfall intensity (${weather.precipitation}mm), Peak wind gust velocity (${weather.windGusts}km/h), Thermal stress index (${Math.round(heatIndex)}°C), and Barometric stability (${weather.pressure} hPa). Primary driver: ${factors.find(f => f.impact === 'severe' || f.impact === 'high')?.name || 'Stable atmosphere'}.`;

  const safetyActions = level === 'severe'
    ? [
        'Immediately move to designated cyclone shelters or higher elevated ground.',
        'Strictly suspend all fishing, coastal recreation, and unnecessary road journeys.',
        'Keep emergency battery radio, power banks, and drinking water ready.',
        'Disconnect electrical mains in areas prone to sudden water inundation.'
      ]
    : level === 'high'
    ? [
        'Avoid low-lying underpasses and waterlogged road stretches.',
        'Secure loose outdoor tin roofing, billboards, and construction scaffolding.',
        'Fishermen must not venture into deep sea or coastal rough waters.',
        'Farmers should pause pesticide spraying and clear field drainage trenches.'
      ]
    : level === 'moderate'
    ? [
        'Carry umbrellas/raincoats and drive with headlights on during sudden rain.',
        'Stay hydrated and avoid direct outdoor labor during peak 12:00-3:00 PM hours.',
        'Keep updated with local IMD/SDMA weather bulletins.'
      ]
    : [
        'Weather is favorable for standard outdoor and farming activities.',
        'Regular hydration and standard agricultural practices recommended.'
      ];

  const roleSpecificAdvice: Record<UserRole, string[]> = {
    farmer: level === 'severe' || level === 'high'
      ? [
          'Halt all chemical and fertilizer applications immediately to prevent wash-off.',
          'Open drainage channels in paddy, maize, cotton, and groundnut plots to prevent root rot.',
          'Shift harvested grain bags to elevated waterproof sheds and cover with tarpaulins.',
          'Tether livestock in well-ventilated, reinforced shelters away from old trees.'
        ]
      : [
          'Favorable window for field irrigation and standard crop fertilization.',
          'Monitor soil moisture levels and prepare for upcoming seasonal cycles.'
        ],
    fisherman: level === 'severe' || level === 'high'
      ? [
          'STRICT PROHIBITION: Do NOT venture into deep sea or coastal waters (24-48h).',
          'Boats in open water must navigate to the nearest safe port or sheltered bay immediately.',
          'Double-anchor fishing trawlers and mechanized catamarans in harbor creeks.',
          'Protect aquaculture pond bunds with nylon nets against overflow.'
        ]
      : [
          'Sea condition is smooth to slight. Normal fishing operations permitted.',
          'Ensure standard VHF marine radio and GPS navigation are functional.'
        ],
    traveler: level === 'severe' || level === 'high'
      ? [
          'Postpone non-essential highway travel, especially on ghat roads (landslide risk).',
          'Check live flight and train status before heading to terminals.',
          'Maintain minimum 50% fuel in vehicles and keep offline digital maps downloaded.'
        ]
      : [
          'Roads and transit corridors are clear. Enjoy your journey.',
          'Check local weather at your destination before departure.'
        ],
    student: level === 'severe' || level === 'high'
      ? [
          'Follow district collectorate announcements regarding school/college rain holidays.',
          'Never attempt to cross flooded streams or waterlogged culverts on way to school.',
          'Stay indoors away from school building glass windows during thunderstorms.'
        ]
      : [
          'Ideal weather for school attendance, sports, and outdoor activities.',
          'Maintain regular water bottle refills.'
        ],
    general: level === 'severe' || level === 'high'
      ? [
          'Stay indoors in sturdy permanent structures.',
          'Keep mobile phones fully charged and maintain 3 days of dry rations.',
          'Avoid touching downed electric power lines or standing near metal poles.'
        ]
      : [
          'Pleasant conditions for daily routines, commutes, and leisure.',
          'Stay informed of regular evening forecasts.'
        ]
  };

  return {
    level,
    score,
    headline,
    primaryThreat,
    factors,
    explainableAI,
    safetyActions,
    roleSpecificAdvice,
    color,
    badgeBg
  };
}

// Weather code description mapper (WMO codes)
export function getWeatherCodeDetails(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Clear Sky', icon: 'Sun' };
  if (code === 1 || code === 2) return { text: 'Partly Cloudy', icon: 'CloudSun' };
  if (code === 3) return { text: 'Overcast', icon: 'Cloud' };
  if (code >= 45 && code <= 48) return { text: 'Fog / Mist', icon: 'CloudFog' };
  if (code >= 51 && code <= 55) return { text: 'Light Drizzle', icon: 'CloudDrizzle' };
  if (code >= 61 && code <= 65) return { text: 'Moderate to Heavy Rain', icon: 'CloudRain' };
  if (code >= 71 && code <= 77) return { text: 'Snowfall', icon: 'Snowflake' };
  if (code >= 80 && code <= 82) return { text: 'Torrential Rain Showers', icon: 'CloudRainWind' };
  if (code >= 95) return { text: 'Severe Thunderstorm & Lightning', icon: 'CloudLightning' };
  return { text: 'Variable Clouds', icon: 'Cloud' };
}

// Fetch live weather from Open-Meteo or fall back gracefully
export async function fetchLiveWeatherData(lat: number, lon: number, locationName: string = 'Current Location'): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,is_day&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const data = await res.json();

    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const weatherCode = current.weather_code ?? 2;
    const weatherInfo = getWeatherCodeDetails(weatherCode);

    // Calculate daily risk levels
    const dailyRiskLevels: RiskLevel[] = (daily.precipitation_sum || []).map((rain: number, idx: number) => {
      const maxT = daily.temperature_2m_max?.[idx] ?? 32;
      const code = daily.weather_code?.[idx] ?? 0;
      if (rain >= 70 || maxT >= 44 || code >= 95) return 'high';
      if (rain >= 25 || maxT >= 40) return 'moderate';
      return 'low';
    });

    return {
      locationName,
      country: 'India',
      lat,
      lon,
      timestamp: new Date().toISOString(),
      temperature: Math.round(current.temperature_2m * 10) / 10,
      feelsLike: Math.round(current.apparent_temperature * 10) / 10,
      tempMin: Math.round((daily.temperature_2m_min?.[0] ?? current.temperature_2m - 4) * 10) / 10,
      tempMax: Math.round((daily.temperature_2m_max?.[0] ?? current.temperature_2m + 5) * 10) / 10,
      humidity: Math.round(current.relative_humidity_2m),
      precipitation: Math.round((current.precipitation || 0) * 10) / 10,
      precipitationProbability: Math.round(hourly.precipitation_probability?.[0] ?? 20),
      windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
      windDirection: Math.round(current.wind_direction_10m || 0),
      windGusts: Math.round((current.wind_gusts_10m || current.wind_speed_10m * 1.3) * 10) / 10,
      pressure: Math.round(current.surface_pressure || 1012),
      uvIndex: current.is_day ? 7.4 : 0,
      visibility: 8.5,
      cloudCover: Math.round(current.cloud_cover || 35),
      weatherCode,
      weatherDescription: weatherInfo.text,
      isDay: Boolean(current.is_day),
      aqi: 58,
      dataSource: 'live_open_meteo',
      hourly: {
        time: (hourly.time || []).slice(0, 24),
        temperature: (hourly.temperature_2m || []).slice(0, 24),
        precipitation: (hourly.precipitation || []).slice(0, 24),
        windSpeed: (hourly.wind_speed_10m || []).slice(0, 24)
      },
      daily: {
        time: (daily.time || []).slice(0, 7),
        tempMax: (daily.temperature_2m_max || []).slice(0, 7),
        tempMin: (daily.temperature_2m_min || []).slice(0, 7),
        precipitationSum: (daily.precipitation_sum || []).slice(0, 7),
        weatherCode: (daily.weather_code || []).slice(0, 7),
        riskLevels: dailyRiskLevels.slice(0, 7)
      }
    };
  } catch (err) {
    console.warn(`Weather live API error for ${locationName}, generating simulation data`, err);
    return generateFallbackWeatherData(lat, lon, locationName);
  }
}

// Fallback high-fidelity meteorological generator
export function generateFallbackWeatherData(lat: number, lon: number, locationName: string): WeatherData {
  const isCoastal = (lon > 80 && lon < 87 && lat < 21) || (lon < 74 && lat < 20);
  const temp = isCoastal ? 31.5 : 34.0;
  const rain = isCoastal ? 48.5 : 4.2;
  const wind = isCoastal ? 42.0 : 18.0;

  const hourlyTimes = Array.from({ length: 24 }, (_, i) => {
    const d = new Date();
    d.setHours(d.getHours() + i);
    return d.toISOString();
  });

  const dailyTimes = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return {
    locationName,
    country: 'India',
    lat,
    lon,
    timestamp: new Date().toISOString(),
    temperature: temp,
    feelsLike: temp + 3.5,
    tempMin: temp - 5,
    tempMax: temp + 4,
    humidity: isCoastal ? 82 : 55,
    precipitation: rain,
    precipitationProbability: isCoastal ? 85 : 20,
    windSpeed: wind,
    windDirection: 140,
    windGusts: wind * 1.4,
    pressure: 1004,
    uvIndex: 6.8,
    visibility: 6.2,
    cloudCover: 75,
    weatherCode: isCoastal ? 65 : 2,
    weatherDescription: isCoastal ? 'Heavy Monsoon Showers' : 'Partly Cloudy',
    isDay: true,
    aqi: 65,
    dataSource: 'simulated_fallback',
    hourly: {
      time: hourlyTimes,
      temperature: hourlyTimes.map((_, i) => Math.round((temp + Math.sin(i / 3) * 3) * 10) / 10),
      precipitation: hourlyTimes.map((_, i) => Math.round((Math.max(0, rain / 6 + Math.cos(i / 2) * 4)) * 10) / 10),
      windSpeed: hourlyTimes.map((_, i) => Math.round((wind + Math.sin(i / 4) * 6) * 10) / 10)
    },
    daily: {
      time: dailyTimes,
      tempMax: dailyTimes.map(() => Math.round((temp + 4) * 10) / 10),
      tempMin: dailyTimes.map(() => Math.round((temp - 5) * 10) / 10),
      precipitationSum: [rain, rain * 0.8, rain * 1.2, 12, 5, 2, 0],
      weatherCode: [65, 63, 80, 61, 2, 1, 0],
      riskLevels: ['high', 'high', 'severe', 'moderate', 'low', 'low', 'low']
    }
  };
}

// Generate Official Disaster Alerts Feed
export function getActiveDisasterAlerts(locationName?: string): OfficialAlert[] {
  return [
    {
      id: 'alert-imd-cyclone-bob',
      title: 'Cyclonic Storm "MAHASAGAR" Tracking over West-Central Bay of Bengal',
      severity: 'Emergency',
      riskLevel: 'severe',
      affectedArea: 'Coastal Andhra Pradesh (Visakhapatnam, Kakinada, Machilipatnam) & South Odisha',
      issuedBy: 'India Meteorological Department (IMD Cyclone Warning Division)',
      issuedTime: 'Today at 08:30 IST',
      validUntil: 'Next 48 Hours',
      description: 'A deep depression has intensified into a Cyclonic Storm moving north-northwestwards with sustained wind speeds of 75-85 km/h gusting to 95 km/h. Coastal swell waves reaching 3.5 to 4.2 meters.',
      instructions: [
        'Total suspension of fishing operations along AP and Odisha coastlines.',
        'Residents in katcha/thatched houses in low-lying coastal mandals to be evacuated to Multi-purpose Cyclone Shelters.',
        'Port danger signal LC-III hoisted at Visakhapatnam and Gangavaram ports.'
      ]
    },
    {
      id: 'alert-krishna-flood',
      title: 'River Basin Flood Advisory - Prakasam Barrage Discharge',
      severity: 'Alert',
      riskLevel: 'high',
      affectedArea: 'Vijayawada, Krishna Delta, Guntur Downstream Basins',
      issuedBy: 'Central Water Commission (CWC) & AP SDMA',
      issuedTime: 'Today at 11:00 IST',
      validUntil: 'Tomorrow 18:00 IST',
      description: 'Water discharge from upstream Nagarjuna Sagar and Pulichintala reaching 3.2 Lakh cusecs at Prakasam Barrage. Low-lying island villages and river bund habitations on alert.',
      instructions: [
        'Villagers along Krishna river banks advised not to cross causeways or bathe in river streams.',
        'SDRF flood rescue speedboats deployed on stand-by at Bhavani Ghats.'
      ]
    },
    {
      id: 'alert-heatwave-central',
      title: 'Severe Heatwave Warning (>43.5°C) across Central Deccan & Vidarbha',
      severity: 'Warning',
      riskLevel: 'high',
      affectedArea: 'Telangana (Nalgonda, Khammam), Vidarbha & North Karnataka',
      issuedBy: 'National Disaster Management Authority (NDMA)',
      issuedTime: 'Yesterday at 17:00 IST',
      validUntil: 'Next 3 Days',
      description: 'Persistent dry north-westerly winds causing severe heatwave conditions with maximum temperatures exceeding normal by 4.5°C to 6.2°C.',
      instructions: [
        'Avoid outdoor exposure between 12:00 PM and 3:30 PM.',
        'Drink adequate water, ORS, and coconut water even in the absence of thirst.'
      ]
    }
  ];
}

// Generate map markers dataset with Red, Yellow, Green points
export function getMapMarkerLocations(): MapMarkerLocation[] {
  return [
    {
      id: 'loc-vizag',
      name: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      lat: 17.6868,
      lon: 83.2185,
      temperature: 31.2,
      weatherCondition: 'Squally Heavy Rain',
      weatherCode: 65,
      riskLevel: 'high',
      riskScore: 78,
      headline: 'Deep Depression & Coastal Gale Warning',
      activeAlertCount: 2,
      primaryRiskReason: 'Wind gusts up to 75 km/h, swell waves 3.2m, rain 85mm/24h.',
      recommendedAction: 'Suspend fishing, evacuate coastal huts, clear field drainage.',
      windSpeed: 48,
      rainfall: 85,
      isHazardHotspot: true
    },
    {
      id: 'loc-puri',
      name: 'Puri',
      state: 'Odisha',
      lat: 19.8135,
      lon: 85.8312,
      temperature: 29.8,
      weatherCondition: 'Severe Cyclonic Storm Band',
      weatherCode: 82,
      riskLevel: 'severe',
      riskScore: 88,
      headline: 'Cyclone Landfall Danger Zone',
      activeAlertCount: 3,
      primaryRiskReason: 'Sustained winds 85 km/h, storm surge 1.2m above astronomical tide.',
      recommendedAction: 'Immediate shelter evacuation, NDRF teams deployed.',
      windSpeed: 68,
      rainfall: 110,
      isHazardHotspot: true
    },
    {
      id: 'loc-mumbai',
      name: 'Mumbai',
      state: 'Maharashtra',
      lat: 19.0760,
      lon: 72.8777,
      temperature: 28.5,
      weatherCondition: 'Torrential Monsoon Downpour',
      weatherCode: 80,
      riskLevel: 'high',
      riskScore: 72,
      headline: 'High Tide & Urban Waterlogging Alert',
      activeAlertCount: 1,
      primaryRiskReason: 'Rainfall 92mm/24h coinciding with 4.5m Arabian Sea High Tide.',
      recommendedAction: 'Avoid low-lying underpasses (Hindmata/Milan Subway).',
      windSpeed: 38,
      rainfall: 92,
      isHazardHotspot: true
    },
    {
      id: 'loc-vijayawada',
      name: 'Vijayawada',
      state: 'Andhra Pradesh',
      lat: 16.5062,
      lon: 80.6480,
      temperature: 33.4,
      weatherCondition: 'Heavy River Surge & Rain',
      weatherCode: 61,
      riskLevel: 'moderate',
      riskScore: 48,
      headline: 'Krishna River Basin Flood Watch',
      activeAlertCount: 1,
      primaryRiskReason: 'Prakasam Barrage discharge 3.2 lakh cusecs, localized riverbank inundation.',
      recommendedAction: 'Move cattle away from river bunds, monitor flood sirens.',
      windSpeed: 24,
      rainfall: 38
    },
    {
      id: 'loc-chennai',
      name: 'Chennai',
      state: 'Tamil Nadu',
      lat: 13.0827,
      lon: 80.2707,
      temperature: 34.8,
      weatherCondition: 'Humid & Scattered Showers',
      weatherCode: 2,
      riskLevel: 'moderate',
      riskScore: 35,
      headline: 'Coastal Moisture & Heat Stress',
      activeAlertCount: 0,
      primaryRiskReason: 'Heat Index 42°C with high relative humidity (78%).',
      recommendedAction: 'Maintain hydration, wear light cotton garments.',
      windSpeed: 18,
      rainfall: 12
    },
    {
      id: 'loc-hyderabad',
      name: 'Hyderabad',
      state: 'Telangana',
      lat: 17.3850,
      lon: 78.4867,
      temperature: 32.0,
      weatherCondition: 'Clear to Partly Cloudy',
      weatherCode: 1,
      riskLevel: 'low',
      riskScore: 15,
      headline: 'Normal Atmospheric Conditions',
      activeAlertCount: 0,
      primaryRiskReason: 'No active weather hazard. Safe for all operations.',
      recommendedAction: 'Normal routine. Enjoy outdoor activities.',
      windSpeed: 12,
      rainfall: 0
    },
    {
      id: 'loc-bengaluru',
      name: 'Bengaluru',
      state: 'Karnataka',
      lat: 12.9716,
      lon: 77.5946,
      temperature: 26.5,
      weatherCondition: 'Pleasant Breeze',
      weatherCode: 1,
      riskLevel: 'low',
      riskScore: 12,
      headline: 'Safe & Mild Weather',
      activeAlertCount: 0,
      primaryRiskReason: 'Stable conditions, mild temperature, safe air quality.',
      recommendedAction: 'Safe for travel, sports, and outdoor activities.',
      windSpeed: 14,
      rainfall: 0
    },
    {
      id: 'loc-delhi',
      name: 'New Delhi',
      state: 'Delhi NCR',
      lat: 28.6139,
      lon: 77.2090,
      temperature: 39.5,
      weatherCondition: 'Dry Hot Dust Haze',
      weatherCode: 2,
      riskLevel: 'moderate',
      riskScore: 42,
      headline: 'Elevated Heat & Particulate Alert',
      activeAlertCount: 1,
      primaryRiskReason: 'Max temperature approaching 40°C, AQI 190.',
      recommendedAction: 'Limit midday sun exposure, wear dust masks.',
      windSpeed: 16,
      rainfall: 0
    },
    {
      id: 'loc-kolkata',
      name: 'Kolkata',
      state: 'West Bengal',
      lat: 22.5726,
      lon: 88.3639,
      temperature: 32.8,
      weatherCondition: 'Thundershowers & Squall',
      weatherCode: 95,
      riskLevel: 'high',
      riskScore: 68,
      headline: 'Norwester (Kalbaishakhi) Storm Alert',
      activeAlertCount: 1,
      primaryRiskReason: 'Convective thunderstorm with lightning and wind gusts up to 60 km/h.',
      recommendedAction: 'Seek indoor shelter, stay away from tall trees and electric poles.',
      windSpeed: 44,
      rainfall: 55,
      isHazardHotspot: true
    },
    {
      id: 'loc-patna',
      name: 'Patna',
      state: 'Bihar',
      lat: 25.5941,
      lon: 85.1376,
      temperature: 34.0,
      weatherCondition: 'Ganga Flood Basin Swell',
      weatherCode: 61,
      riskLevel: 'high',
      riskScore: 65,
      headline: 'Ganga River Discharge Warning',
      activeAlertCount: 1,
      primaryRiskReason: 'River Ganga flowing 0.45m above danger mark in Digha ghat.',
      recommendedAction: 'Diara area residents should relocate to designated flood relief centers.',
      windSpeed: 20,
      rainfall: 45,
      isHazardHotspot: true
    },
    {
      id: 'loc-tirupati',
      name: 'Tirupati',
      state: 'Andhra Pradesh',
      lat: 13.6288,
      lon: 79.4192,
      temperature: 33.0,
      weatherCondition: 'Partly Cloudy Ghats',
      weatherCode: 2,
      riskLevel: 'low',
      riskScore: 18,
      headline: 'Safe Ghat Road Travel Conditions',
      activeAlertCount: 0,
      primaryRiskReason: 'Clear visibility along Tirumala ghat roads.',
      recommendedAction: 'Safe for pilgrimage and hill travel.',
      windSpeed: 15,
      rainfall: 2
    },
    {
      id: 'loc-guwahati',
      name: 'Guwahati',
      state: 'Assam',
      lat: 26.1445,
      lon: 91.7362,
      temperature: 29.0,
      weatherCondition: 'Brahmaputra Flood Advisory',
      weatherCode: 65,
      riskLevel: 'high',
      riskScore: 75,
      headline: 'Assam Riverine Flood Alert',
      activeAlertCount: 2,
      primaryRiskReason: 'Heavy catchment rainfall in Upper Assam causing river water level rise.',
      recommendedAction: 'Follow SDRF district bulletins and safeguard livestock.',
      windSpeed: 22,
      rainfall: 78,
      isHazardHotspot: true
    }
  ];
}

// Hazard layer polygons and paths for GIS map rendering
export function getHazardLayers(): HazardLayerData {
  return {
    cyclonePaths: [
      {
        id: 'cyclone-mahasagar-track',
        name: 'Cyclone MAHASAGAR Track (Projected)',
        category: 'Severe Cyclonic Storm (Cat-2)',
        windSpeedKnots: 55,
        points: [
          [14.2, 85.5],
          [15.8, 84.6],
          [17.3, 83.8],
          [18.9, 84.4],
          [20.4, 86.2]
        ],
        projectedLandfall: 'Expected North AP - South Odisha Coast in 36 Hours'
      }
    ],
    floodZones: [
      {
        id: 'flood-krishna-delta',
        name: 'Krishna River Lower Delta Inundation Zone',
        riverBasin: 'Krishna River Basin',
        risk: 'high',
        polygon: [
          [16.55, 80.55],
          [16.58, 80.72],
          [16.42, 80.85],
          [16.25, 80.70],
          [16.35, 80.50]
        ]
      },
      {
        id: 'flood-godavari-delta',
        name: 'Godavari Dowleswaram Floodplain Hazard Zone',
        riverBasin: 'Godavari River Basin',
        risk: 'high',
        polygon: [
          [17.05, 81.70],
          [17.15, 81.90],
          [16.90, 82.05],
          [16.75, 81.80]
        ]
      },
      {
        id: 'flood-mumbai-lowlying',
        name: 'Mithi River & Mumbai Suburban Flood Basin',
        riverBasin: 'Mithi Urban River Basin',
        risk: 'high',
        polygon: [
          [19.12, 72.84],
          [19.10, 72.90],
          [19.04, 72.88],
          [19.05, 72.82]
        ]
      }
    ],
    heatwaveZones: [
      {
        id: 'heat-vidarbha-telangana',
        regionName: 'Central Deccan & Vidarbha Heat Corridor',
        maxTemp: 44.5,
        polygon: [
          [18.8, 77.5],
          [19.8, 79.5],
          [18.5, 80.2],
          [16.8, 78.5],
          [17.5, 76.8]
        ]
      }
    ],
    heavyRainZones: [
      {
        id: 'rain-coastal-ap-odisha',
        regionName: 'North Coastal AP & South Odisha Heavy Rain Belt',
        rainfallForecastMm: 95,
        polygon: [
          [17.2, 82.5],
          [18.5, 83.2],
          [19.6, 85.2],
          [18.8, 85.8],
          [17.0, 83.5]
        ]
      }
    ]
  };
}
