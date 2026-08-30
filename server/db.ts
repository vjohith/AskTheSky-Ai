import fs from 'fs';
import path from 'path';
import { UserAccount, UserStoredFile, ChatMessage, RiskLevel, UserRole, Language, CommunityReport } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'database.json');

interface DatabaseSchema {
  users: (UserAccount & { passwordHash: string })[];
  files: UserStoredFile[];
  chatHistory: (ChatMessage & { userId?: string })[];
  communityReports: CommunityReport[];
  sosAlerts: {
    id: string;
    userId?: string;
    userName: string;
    location: string;
    lat?: number;
    lon?: number;
    hazardType: string;
    status: 'ACTIVE' | 'RESOLVED';
    timestamp: string;
    message: string;
  }[];
}

const initialSeedData: DatabaseSchema = {
  users: [
    {
      id: 'demo-user-1',
      email: 'demo@askthesky.ai',
      passwordHash: 'demopass123', // In demo, plain/hashed match
      name: 'Ravi Kumar (Demo Farmer)',
      role: 'farmer',
      language: 'te',
      phone: '+91 98765 43210',
      savedLocations: [
        { id: 'loc-1', name: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lon: 83.2185, customName: 'Vizag Coastline Farm', alertThreshold: 'moderate' },
        { id: 'loc-2', name: 'Vijayawada, Andhra Pradesh', lat: 16.5062, lon: 80.6480, customName: 'Krishna Delta Field', alertThreshold: 'high' },
        { id: 'loc-3', name: 'Hyderabad, Telangana', lat: 17.3850, lon: 78.4867, customName: 'Storage Warehouse', alertThreshold: 'high' }
      ],
      alertPreferences: {
        smsAlerts: true,
        emailAlerts: true,
        highRiskOnly: false,
        voiceAnnouncements: true,
      },
      createdAt: new Date().toISOString()
    }
  ],
  communityReports: [
    {
      id: 'rep-seed-1',
      userId: 'citizen-88',
      userName: 'K. Subrahmanyam',
      userRole: 'fisherman',
      location: 'Visakhapatnam RK Beach Road',
      lat: 17.7126,
      lon: 83.3228,
      hazardType: 'high_waves',
      severity: 'danger',
      title: 'High Swell Surges Near RK Beach Fishing Jetty',
      suggestion: 'Sea water is surging onto the service road. Waves over 3.5m high. All small boats should be hauled up beyond the promenade.',
      safetyAdvice: 'Do not approach the pier or rocky shore. Local fishing harbor has suspended launches for 24h.',
      upvotes: 42,
      downvotes: 1,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      verified: true
    },
    {
      id: 'rep-seed-2',
      userId: 'citizen-42',
      userName: 'Anita Rao',
      userRole: 'traveler',
      location: 'Araku Valley Ghat Road (NH-516E)',
      lat: 18.3273,
      lon: 82.8775,
      hazardType: 'landslide',
      severity: 'danger',
      title: 'Small Rockfall & Mudslide near 8th Hairpin Bend',
      suggestion: 'Heavy rain triggered loose gravel and mud onto one lane. Traffic moving single-file slowly.',
      safetyAdvice: 'Heavy vehicles avoid ghat road until cleared. Drive strictly below 20 km/h with hazard lights.',
      upvotes: 28,
      downvotes: 0,
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      verified: true
    },
    {
      id: 'rep-seed-3',
      userId: 'citizen-91',
      userName: 'M. Venkateswarlu',
      userRole: 'farmer',
      location: 'Krishna Canal Bund, Vijayawada Rural',
      lat: 16.5186,
      lon: 80.6200,
      hazardType: 'flood',
      severity: 'caution',
      title: 'Canal Inflow Approaching Spill Level in Low Paddy Fields',
      suggestion: 'Canal water level is 0.4m below bund top. Farmers in low-lying sectors should open lateral drainage drains.',
      safetyAdvice: 'Move pump sets and livestock to higher ground immediately before tonight\'s upstream release.',
      upvotes: 35,
      downvotes: 2,
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      verified: true
    }
  ],
  files: [
    {
      id: 'file-seed-1',
      userId: 'demo-user-1',
      originalName: 'Cyclone_Evacuation_Plan_2026.pdf',
      fileName: 'seed_cyclone_plan.pdf',
      mimeType: 'application/pdf',
      size: 245000,
      category: 'disaster_plan',
      uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      url: '/api/files/download/file-seed-1'
    },
    {
      id: 'file-seed-2',
      userId: 'demo-user-1',
      originalName: 'Kharif_Crop_Damage_Receipt.jpg',
      fileName: 'seed_crop_receipt.jpg',
      mimeType: 'image/jpeg',
      size: 184000,
      category: 'crop_report',
      uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      url: '/api/files/download/file-seed-2'
    }
  ],
  chatHistory: [
    {
      id: 'msg-1',
      userId: 'demo-user-1',
      sender: 'user',
      text: 'What is the cyclone and heavy rainfall risk in Visakhapatnam for the next 48 hours?',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      language: 'en'
    },
    {
      id: 'msg-2',
      userId: 'demo-user-1',
      sender: 'ai',
      text: '⚠️ **Visakhapatnam Risk Status: HIGH (Red Alert)**\n\nA deep depression over the West-Central Bay of Bengal is generating wind gusts up to 65-75 km/h and isolated heavy rainfall (70-110 mm/24h). Coastline swell waves reach 3.2m.\n\n**Key Actions for Farmers & Fishermen:**\n1. Do NOT venture into deep sea or coastal waters.\n2. Ensure proper drainage channels in standing paddy and maize fields to prevent waterlogging.\n3. Secure harvested grains in elevated, moisture-proof storage.',
      speechText: 'High risk alert for Visakhapatnam. Heavy rainfall and strong wind gusts expected. Fishermen must avoid sea venture and farmers should clear drainage in standing crops.',
      timestamp: new Date(Date.now() - 3600000 * 4 + 1000).toISOString(),
      language: 'en',
      detectedLocation: 'Visakhapatnam',
      ragCitations: ['IMD Special Tropical Weather Outlook', 'NDMA Cyclone Contingency Protocol - Coastal AP']
    }
  ],
  sosAlerts: []
};

class DBManager {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read DB file, using in-memory seed', e);
    }
    this.save(initialSeedData);
    return JSON.parse(JSON.stringify(initialSeedData));
  }

  private save(data?: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data || this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving DB:', e);
    }
  }

  // Users
  getUserByEmail(email: string) {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string) {
    const u = this.db.users.find(user => user.id === id);
    if (!u) return null;
    const { passwordHash, ...userAccount } = u;
    return userAccount;
  }

  createUser(data: { email: string; password: string; name: string; role?: UserRole; language?: Language; phone?: string }) {
    const existing = this.getUserByEmail(data.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }
    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      email: data.email,
      passwordHash: data.password,
      name: data.name || data.email.split('@')[0],
      role: data.role || 'general',
      language: data.language || 'en',
      phone: data.phone || '',
      savedLocations: [
        { id: 'loc-default', name: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lon: 83.2185, customName: 'Home Location', alertThreshold: 'moderate' as RiskLevel }
      ],
      alertPreferences: {
        smsAlerts: true,
        emailAlerts: true,
        highRiskOnly: false,
        voiceAnnouncements: true,
      },
      createdAt: new Date().toISOString()
    };
    this.db.users.push(newUser);
    this.save();
    const { passwordHash, ...userAccount } = newUser;
    return userAccount;
  }

  updateUserProfile(userId: string, updates: Partial<UserAccount>) {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.language !== undefined) user.language = updates.language;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.alertPreferences !== undefined) user.alertPreferences = updates.alertPreferences;
    this.save();
    const { passwordHash, ...userAccount } = user;
    return userAccount;
  }

  // Saved Locations
  getSavedLocations(userId: string) {
    const user = this.db.users.find(u => u.id === userId);
    return user ? user.savedLocations : [];
  }

  addSavedLocation(userId: string, loc: { name: string; lat: number; lon: number; customName?: string; alertThreshold?: RiskLevel }) {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    const newLoc = {
      id: 'loc_' + Date.now(),
      name: loc.name,
      lat: loc.lat,
      lon: loc.lon,
      customName: loc.customName || loc.name,
      alertThreshold: loc.alertThreshold || 'moderate'
    };
    user.savedLocations.push(newLoc);
    this.save();
    return newLoc;
  }

  deleteSavedLocation(userId: string, locationId: string) {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.savedLocations = user.savedLocations.filter(l => l.id !== locationId);
    this.save();
    return true;
  }

  // Files & Security
  getUserFiles(userId: string): UserStoredFile[] {
    return this.db.files.filter(f => f.userId === userId);
  }

  getFileById(fileId: string, userId: string): UserStoredFile | null {
    const file = this.db.files.find(f => f.id === fileId);
    if (!file) return null;
    // Security check: only owner can access
    if (file.userId !== userId) {
      return null;
    }
    return file;
  }

  addFile(fileData: Omit<UserStoredFile, 'id' | 'uploadedAt' | 'url'>): UserStoredFile {
    const id = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const newFile: UserStoredFile = {
      ...fileData,
      id,
      uploadedAt: new Date().toISOString(),
      url: `/api/files/download/${id}`
    };
    this.db.files.push(newFile);
    this.save();
    return newFile;
  }

  deleteFile(fileId: string, userId: string): boolean {
    const index = this.db.files.findIndex(f => f.id === fileId && f.userId === userId);
    if (index === -1) return false;
    const file = this.db.files[index];
    // Remove disk file if exists
    try {
      const diskPath = path.join(UPLOADS_DIR, file.fileName);
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    } catch (e) {
      console.warn('Could not delete disk file', e);
    }
    this.db.files.splice(index, 1);
    this.save();
    return true;
  }

  // Chat History
  getChatHistory(userId?: string): ChatMessage[] {
    if (!userId) {
      return this.db.chatHistory.slice(-20);
    }
    return this.db.chatHistory.filter(c => !c.userId || c.userId === userId);
  }

  addChatMessage(msg: ChatMessage & { userId?: string }) {
    this.db.chatHistory.push(msg);
    // Keep max 100 recent
    if (this.db.chatHistory.length > 200) {
      this.db.chatHistory = this.db.chatHistory.slice(-150);
    }
    this.save();
    return msg;
  }

  clearChatHistory(userId?: string) {
    if (!userId) {
      this.db.chatHistory = [];
    } else {
      this.db.chatHistory = this.db.chatHistory.filter(c => c.userId && c.userId !== userId);
    }
    this.save();
    return true;
  }

  // SOS Alerts
  createSOSAlert(alert: { userId?: string; userName: string; location: string; lat?: number; lon?: number; hazardType: string; message: string }) {
    const id = 'sos_' + Date.now();
    const newAlert = {
      id,
      ...alert,
      status: 'ACTIVE' as const,
      timestamp: new Date().toISOString()
    };
    this.db.sosAlerts.unshift(newAlert);
    this.save();
    return newAlert;
  }

  getSOSAlerts() {
    return this.db.sosAlerts;
  }

  // Community "LetThemKnow" Reports
  getCommunityReports(hazardFilter?: string, searchLocation?: string): CommunityReport[] {
    if (!this.db.communityReports) {
      this.db.communityReports = initialSeedData.communityReports || [];
    }
    let list = [...this.db.communityReports];
    if (hazardFilter && hazardFilter !== 'all') {
      list = list.filter(r => r.hazardType === hazardFilter);
    }
    if (searchLocation && searchLocation.trim().length > 0) {
      const q = searchLocation.toLowerCase().trim();
      list = list.filter(r => r.location.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));
    }
    // Sort newest first
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  createCommunityReport(report: Omit<CommunityReport, 'id' | 'upvotes' | 'downvotes' | 'timestamp'>): CommunityReport {
    if (!this.db.communityReports) {
      this.db.communityReports = [];
    }
    const id = 'rep_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newReport: CommunityReport = {
      id,
      ...report,
      upvotes: 1, // Author's implicit upvote
      downvotes: 0,
      timestamp: new Date().toISOString(),
      verified: true
    };
    this.db.communityReports.unshift(newReport);
    this.save();
    return newReport;
  }

  voteCommunityReport(reportId: string, type: 'up' | 'down'): CommunityReport | null {
    if (!this.db.communityReports) return null;
    const rep = this.db.communityReports.find(r => r.id === reportId);
    if (!rep) return null;
    if (type === 'up') {
      rep.upvotes += 1;
    } else {
      rep.downvotes += 1;
    }
    this.save();
    return rep;
  }
}

export const db = new DBManager();
export { UPLOADS_DIR };
