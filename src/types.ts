export type Language = 'en' | 'te' | 'hi';

export type UserRole = 'general' | 'farmer' | 'fisherman' | 'traveler' | 'student';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface WeatherData {
  locationName: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  timestamp: string;
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  cloudCover: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  aqi?: number;
  dataSource: 'live_open_meteo' | 'imd_official' | 'simulated_fallback';
  hourly: {
    time: string[];
    temperature: number[];
    precipitation: number[];
    windSpeed: number[];
  };
  daily: {
    time: string[];
    tempMax: number[];
    tempMin: number[];
    precipitationSum: number[];
    weatherCode: number[];
    riskLevels: RiskLevel[];
  };
  historicalComparison?: {
    normalTemp: number;
    normalPrecipitationMm: number;
    cycloneFrequencyPerDecade: number;
  };
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0 - 100
  headline: string;
  primaryThreat: string;
  factors: {
    name: string;
    value: string;
    impact: 'low' | 'moderate' | 'high' | 'severe';
    description: string;
  }[];
  explainableAI: string;
  safetyActions: string[];
  roleSpecificAdvice: Record<UserRole, string[]>;
  color: string;
  badgeBg: string;
}

export interface OfficialAlert {
  id: string;
  title: string;
  severity: 'Warning' | 'Alert' | 'Watch' | 'Emergency';
  riskLevel: RiskLevel;
  affectedArea: string;
  issuedBy: string; // e.g. IMD / NDMA / SDMA
  issuedTime: string;
  validUntil: string;
  description: string;
  instructions: string[];
  isDemo?: boolean;
}

export interface MapMarkerLocation {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  temperature: number;
  weatherCondition: string;
  weatherCode: number;
  riskLevel: RiskLevel;
  riskScore: number;
  headline: string;
  activeAlertCount: number;
  primaryRiskReason: string;
  recommendedAction: string;
  windSpeed: number;
  rainfall: number;
  isHazardHotspot?: boolean;
}

export interface HazardLayerData {
  cyclonePaths: {
    id: string;
    name: string;
    category: string;
    windSpeedKnots: number;
    points: [number, number][]; // [lat, lon]
    projectedLandfall: string;
  }[];
  floodZones: {
    id: string;
    name: string;
    riverBasin: string;
    risk: RiskLevel;
    polygon: [number, number][];
  }[];
  heatwaveZones: {
    id: string;
    regionName: string;
    maxTemp: number;
    polygon: [number, number][];
  }[];
  heavyRainZones: {
    id: string;
    regionName: string;
    rainfallForecastMm: number;
    polygon: [number, number][];
  }[];
}

export interface EmergencyFacility {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire' | 'shelter' | 'relief_center';
  address: string;
  phone: string;
  lat: number;
  lon: number;
  distanceKm?: number;
  capacity?: string;
  open24x7: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  language: Language;
  phone?: string;
  savedLocations: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    customName?: string;
    alertThreshold: RiskLevel;
  }[];
  alertPreferences: {
    smsAlerts: boolean;
    emailAlerts: boolean;
    highRiskOnly: boolean;
    voiceAnnouncements: boolean;
  };
  createdAt: string;
}

export interface SavedLocation {
  id: string;
  userId?: string;
  name: string;
  customName?: string;
  lat: number;
  lon: number;
  alertThreshold: RiskLevel;
  createdAt?: string;
}

export interface UserStoredFile {
  id: string;
  userId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: 'disaster_plan' | 'crop_report' | 'insurance_claim' | 'emergency_id' | 'crop_damage' | 'insurance' | 'medical_record' | 'other' | string;
  uploadedAt: string;
  url?: string;
}

export type UserFile = UserStoredFile;

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  description: string;
  available: string;
  category: string;
  icon?: string;
}

export interface CommunityReport {
  id: string;
  userId?: string;
  userName: string;
  userRole?: UserRole;
  location: string;
  lat?: number;
  lon?: number;
  hazardType: 'cyclone' | 'flood' | 'heavy_rain' | 'landslide' | 'heatwave' | 'lightning' | 'high_waves' | 'road_blocked' | 'power_outage' | 'other';
  severity: 'caution' | 'danger' | 'emergency';
  title: string;
  suggestion: string;
  safetyAdvice: string;
  upvotes: number;
  downvotes: number;
  userVoted?: 'up' | 'down';
  timestamp: string;
  verified?: boolean;
}

export interface SurvivalGuide {
  id: string;
  hazard: string;
  summary: string;
  before: string[];
  during: string[];
  after: string[];
  firstAid: string[];
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  location: string;
  lat?: number;
  lon?: number;
  hazardType: string;
  message: string;
  timestamp: string;
  status: 'PENDING' | 'DISPATCHED' | 'RESOLVED';
}

export interface ChatMessage {
  id: string;
  userId?: string;
  sender: 'user' | 'ai';
  text: string;
  speechText?: string;
  timestamp: string;
  language: Language;
  detectedLocation?: string;
  riskAssessment?: RiskAssessment;
  weatherSnippet?: {
    temp: number;
    feelsLike?: number;
    condition: string;
    location: string;
    rain: number;
    wind: number;
    humidity?: number;
  };
  ragCitations?: string[];
}

export interface RAGDocument {
  id: string;
  title: string;
  source: string;
  category: string;
  summary?: string;
  content?: string;
  targetRole?: string;
  hazardType?: string;
  keyInstructions?: string[];
}
