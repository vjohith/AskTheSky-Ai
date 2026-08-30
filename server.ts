import express from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db, UPLOADS_DIR } from './server/db';
import { fetchLiveWeatherData, assessDisasterRisk, SEED_LOCATIONS, getMapMarkerLocations, getHazardLayers, getActiveDisasterAlerts } from './server/weather';
import { generateAIAdvisory } from './server/ai';
import { EMERGENCY_CONTACTS, EMERGENCY_FACILITIES, SURVIVAL_GUIDES } from './server/emergencyData';
import { RAG_KNOWLEDGE_BASE, retrieveRAGContext } from './server/rag';

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitized);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper middleware to extract user context
  const getUserContext = (req: express.Request) => {
    const authHeader = req.headers['x-user-id'] as string;
    if (authHeader && authHeader.trim().length > 0) {
      return authHeader.trim();
    }
    return 'demo-user-1'; // Default demo user if unauthenticated
  };

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'AskTheSky AI',
      slogan: 'Ask the Sky. Know the Risk. Stay Safe.',
      version: '1.0.0 (SIH Project)',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // --- AUTHENTICATION & USER MANAGEMENT ---
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, name, role, language, phone } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const user = db.createUser({ email, password, name, role, language, phone });
      res.status(201).json({ user, token: user.id });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const user = db.getUserByEmail(email);
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const { passwordHash, ...userAccount } = user;
    res.json({ user: userAccount, token: user.id });
  });

  app.get('/api/auth/me', (req, res) => {
    const userId = getUserContext(req);
    const user = db.getUserById(userId);
    if (!user) {
      // Return demo user if not found
      const demoUser = db.getUserById('demo-user-1');
      return res.json({ user: demoUser, token: 'demo-user-1' });
    }
    res.json({ user, token: user.id });
  });

  app.post('/api/auth/update-profile', (req, res) => {
    try {
      const userId = getUserContext(req);
      const updated = db.updateUserProfile(userId, req.body);
      res.json({ user: updated });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Update failed' });
    }
  });

  // --- WEATHER & DISASTER ENGINE APIS ---
  app.get('/api/weather/current', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string) || 17.6868; // Default Visakhapatnam
      const lon = parseFloat(req.query.lon as string) || 83.2185;
      const locationName = (req.query.name as string) || 'Visakhapatnam, Andhra Pradesh';

      const weather = await fetchLiveWeatherData(lat, lon, locationName);
      const risk = assessDisasterRisk({
        temp: weather.temperature,
        humidity: weather.humidity,
        precipitation: weather.precipitation,
        windSpeed: weather.windSpeed,
        windGusts: weather.windGusts,
        pressure: weather.pressure,
        weatherCode: weather.weatherCode,
        locationName
      });

      res.json({ weather, risk });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Failed to fetch weather' });
    }
  });

  app.get('/api/weather/search', async (req, res) => {
    const q = (req.query.q as string || '').toLowerCase().trim();
    if (!q) {
      return res.json({ results: SEED_LOCATIONS.slice(0, 10) });
    }

    // Check local seed list first
    const localMatches = SEED_LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.state && l.state.toLowerCase().includes(q)) ||
      l.country.toLowerCase().includes(q)
    );

    if (localMatches.length > 0) {
      return res.json({ results: localMatches });
    }

    // Try Open-Meteo geocoding for any global location
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(3000) });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const formatted = geoData.results.map((r: any) => ({
            name: r.name,
            state: r.admin1 || '',
            country: r.country || '',
            lat: r.latitude,
            lon: r.longitude
          }));
          return res.json({ results: formatted });
        }
      }
    } catch (e) {
      console.warn('Geocoding search API error', e);
    }

    res.json({ results: SEED_LOCATIONS.slice(0, 5) });
  });

  app.get('/api/weather/map-markers', (req, res) => {
    const markers = getMapMarkerLocations();
    res.json({ markers });
  });

  app.get('/api/weather/hazard-layers', (req, res) => {
    const layers = getHazardLayers();
    res.json({ layers });
  });

  app.get('/api/weather/alerts', (req, res) => {
    const location = (req.query.location as string) || '';
    const alerts = getActiveDisasterAlerts(location);
    res.json({ alerts });
  });

  // --- AI ADVISORY & VOICE ENGINE ---
  app.post('/api/ai/advisory', async (req, res) => {
    try {
      const { userQuery, userRole, language, currentLocation, lat, lon } = req.body;
      if (!userQuery || typeof userQuery !== 'string') {
        return res.status(400).json({ error: 'userQuery is required' });
      }

      const advisory = await generateAIAdvisory({
        userQuery,
        userRole,
        language,
        currentLocation,
        lat,
        lon
      });

      // Also record message into DB
      const userId = getUserContext(req);
      db.addChatMessage({
        id: 'msg_' + Date.now() + '_u',
        userId,
        sender: 'user',
        text: userQuery,
        timestamp: new Date().toISOString(),
        language: language || 'en'
      });

      db.addChatMessage({
        id: 'msg_' + Date.now() + '_ai',
        userId,
        sender: 'ai',
        text: advisory.answerText,
        speechText: advisory.speechText,
        timestamp: new Date().toISOString(),
        language: language || 'en',
        detectedLocation: advisory.detectedLocation,
        riskAssessment: advisory.riskAssessment,
        weatherSnippet: advisory.weatherSnippet,
        ragCitations: advisory.ragCitations
      });

      res.json(advisory);
    } catch (e: any) {
      console.error('AI Advisory endpoint error:', e);
      res.status(500).json({ error: e.message || 'AI processing failed' });
    }
  });

  // --- SAVED LOCATIONS ---
  app.get('/api/saved-locations', (req, res) => {
    const userId = getUserContext(req);
    const locations = db.getSavedLocations(userId);
    res.json({ locations });
  });

  app.post('/api/saved-locations', (req, res) => {
    try {
      const userId = getUserContext(req);
      const { name, lat, lon, customName, alertThreshold } = req.body;
      if (!name || lat === undefined || lon === undefined) {
        return res.status(400).json({ error: 'Name, lat, and lon are required' });
      }
      const newLoc = db.addSavedLocation(userId, { name, lat, lon, customName, alertThreshold });
      res.status(201).json({ location: newLoc });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/saved-locations/:id', (req, res) => {
    const userId = getUserContext(req);
    const success = db.deleteSavedLocation(userId, req.params.id);
    res.json({ success });
  });

  // --- FILE STORAGE & DOCUMENTS ---
  app.get('/api/files', (req, res) => {
    const userId = getUserContext(req);
    const files = db.getUserFiles(userId);
    res.json({ files });
  });

  app.post('/api/files/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const userId = getUserContext(req);
      const category = (req.body.category as any) || 'disaster_plan';

      const fileRecord = db.addFile({
        userId,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        category
      });

      res.status(201).json({ file: fileRecord });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/files/:id', (req, res) => {
    const userId = getUserContext(req);
    const success = db.deleteFile(req.params.id, userId);
    if (!success) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }
    res.json({ success: true });
  });

  app.get('/api/files/download/:id', (req, res) => {
    const userId = getUserContext(req);
    const file = db.getFileById(req.params.id, userId);
    if (!file) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }
    const diskPath = path.join(UPLOADS_DIR, file.fileName);
    if (!fs.existsSync(diskPath)) {
      // If seed file simulated, send sample text
      res.setHeader('Content-Type', file.mimeType);
      return res.send(`[AskTheSky AI File Vault - ${file.originalName}]\nUploaded by User: ${file.userId}\nDate: ${file.uploadedAt}`);
    }
    res.download(diskPath, file.originalName);
  });

  // --- CHAT HISTORY ---
  app.get('/api/chat-history', (req, res) => {
    const userId = getUserContext(req);
    const history = db.getChatHistory(userId);
    res.json({ messages: history });
  });

  app.delete('/api/chat-history', (req, res) => {
    const userId = getUserContext(req);
    db.clearChatHistory(userId);
    res.json({ success: true });
  });

  // --- EMERGENCY & RELIEF APIS ---
  app.get('/api/emergency/contacts', (req, res) => {
    res.json({ contacts: EMERGENCY_CONTACTS });
  });

  app.get('/api/emergency/facilities', (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const type = req.query.type as string;

    let facilities = [...EMERGENCY_FACILITIES];

    if (type && type !== 'all') {
      facilities = facilities.filter(f => f.type === type);
    }

    if (!isNaN(lat) && !isNaN(lon)) {
      // Calculate distance in km
      facilities = facilities.map(f => {
        const dLat = (f.lat - lat) * (Math.PI / 180);
        const dLon = (f.lon - lon) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat * (Math.PI / 180)) * Math.cos(f.lat * (Math.PI / 180)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = 6371 * c; // Earth radius km
        return {
          ...f,
          distanceKm: Math.round(d * 10) / 10
        };
      });
      facilities.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    res.json({ facilities });
  });

  app.get('/api/emergency/guides', (req, res) => {
    res.json({ guides: SURVIVAL_GUIDES });
  });

  app.post('/api/emergency/sos', (req, res) => {
    const { userName, location, lat, lon, hazardType, message } = req.body;
    const userId = getUserContext(req);
    const alert = db.createSOSAlert({
      userId,
      userName: userName || 'Citizen in Distress',
      location: location || 'Current GPS Location',
      lat,
      lon,
      hazardType: hazardType || 'Severe Weather / Flood',
      message: message || 'Urgent evacuation / rescue assistance requested.'
    });
    res.status(201).json({ alert, status: 'DISPATCHED_TO_NDRF_AND_LOCAL_AUTHORITIES' });
  });

  // --- LET THEM KNOW (COMMUNITY DISASTER REPORTS & SUGGESTIONS) ---
  app.get('/api/community-reports', (req, res) => {
    const hazard = req.query.hazard as string;
    const search = req.query.search as string;
    const reports = db.getCommunityReports(hazard, search);
    res.json({ reports });
  });

  app.post('/api/community-reports', (req, res) => {
    try {
      const userId = getUserContext(req);
      const { userName, userRole, location, lat, lon, hazardType, severity, title, suggestion, safetyAdvice } = req.body;
      
      if (!location || !title || !suggestion) {
        return res.status(400).json({ error: 'Location, Title, and Suggestion are required' });
      }

      const report = db.createCommunityReport({
        userId,
        userName: userName || 'Alert Citizen',
        userRole: userRole || 'general',
        location,
        lat: lat ? parseFloat(lat) : undefined,
        lon: lon ? parseFloat(lon) : undefined,
        hazardType: hazardType || 'other',
        severity: severity || 'caution',
        title,
        suggestion,
        safetyAdvice: safetyAdvice || 'Stay alert, follow local advisory, and avoid affected areas.'
      });

      res.status(201).json({ report, message: 'Community alert broadcasted successfully' });
    } catch (e: any) {
      console.error('Create community report error:', e);
      res.status(500).json({ error: e.message || 'Failed to post community report' });
    }
  });

  app.post('/api/community-reports/:id/vote', (req, res) => {
    const { type } = req.body; // 'up' or 'down'
    if (type !== 'up' && type !== 'down') {
      return res.status(400).json({ error: 'Invalid vote type' });
    }
    const updated = db.voteCommunityReport(req.params.id, type);
    if (!updated) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ report: updated });
  });

  // --- RAG KNOWLEDGE BASE EXPLORER ---
  app.get('/api/rag/documents', (req, res) => {
    res.json({ documents: RAG_KNOWLEDGE_BASE });
  });

  app.post('/api/rag/query', (req, res) => {
    const { query, location, role } = req.body;
    const result = retrieveRAGContext(query || '', location, role);
    res.json(result);
  });

  // Vite Middleware for Development / Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 AskTheSky AI Server running on http://0.0.0.0:${PORT}`);
    console.log(`🌧️ "Ask the Sky. Know the Risk. Stay Safe."`);
    console.log(`🏆 SIH 2026 Project Demonstration - Team SynapX`);
    console.log(`======================================================\n`);
  });
}

startServer();
