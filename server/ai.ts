import { GoogleGenAI } from '@google/genai';
import { retrieveRAGContext } from './rag';
import { fetchLiveWeatherData, assessDisasterRisk, SEED_LOCATIONS } from './weather';
import { UserRole, Language, RiskAssessment } from '../src/types';

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export interface AIAdvisoryRequest {
  userQuery: string;
  userRole?: UserRole;
  language?: Language;
  currentLocation?: string;
  lat?: number;
  lon?: number;
}

export interface AIAdvisoryResponse {
  answerText: string;
  speechText: string;
  detectedLocation: string;
  targetRole: UserRole;
  language: Language;
  riskAssessment: RiskAssessment;
  weatherSnippet: {
    location: string;
    temp: number;
    feelsLike: number;
    condition: string;
    rain: number;
    wind: number;
    humidity: number;
  };
  ragCitations: string[];
  isRealAI: boolean;
}

// Extract location from user query or default
function detectLocationFromQuery(query: string, fallbackLocation: string = 'Visakhapatnam'): { name: string; lat: number; lon: number } {
  const queryLower = query.toLowerCase();

  for (const loc of SEED_LOCATIONS) {
    if (queryLower.includes(loc.name.toLowerCase()) || (loc.state && queryLower.includes(loc.state.toLowerCase()))) {
      return { name: loc.name, lat: loc.lat, lon: loc.lon };
    }
  }

  // Common aliases
  if (queryLower.includes('vizag') || queryLower.includes('waltair')) {
    return { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 };
  }
  if (queryLower.includes('delhi') || queryLower.includes('ncr')) {
    return { name: 'New Delhi', lat: 28.6139, lon: 77.2090 };
  }
  if (queryLower.includes('bombay')) {
    return { name: 'Mumbai', lat: 19.0760, lon: 72.8777 };
  }

  // Fallback match
  const matched = SEED_LOCATIONS.find(l => l.name.toLowerCase() === fallbackLocation.toLowerCase());
  if (matched) return { name: matched.name, lat: matched.lat, lon: matched.lon };

  return { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 };
}

// Detect user role intent from query if not specified
function detectRoleFromQuery(query: string, currentRole: UserRole = 'general'): UserRole {
  const q = query.toLowerCase();
  if (q.includes('farmer') || q.includes('crop') || q.includes('paddy') || q.includes('cotton') || q.includes('harvest') || q.includes('irrigation') || q.includes('రైతు') || q.includes('పంట') || q.includes('किसान') || q.includes('फसल')) {
    return 'farmer';
  }
  if (q.includes('fish') || q.includes('boat') || q.includes('sea') || q.includes('harbor') || q.includes('ocean') || q.includes('trawler') || q.includes('వేట') || q.includes('మత్స్య') || q.includes('मछुआरा') || q.includes('नाव')) {
    return 'fisherman';
  }
  if (q.includes('travel') || q.includes('road') || q.includes('highway') || q.includes('drive') || q.includes('flight') || q.includes('train') || q.includes('trip') || q.includes('ప్రయాణ') || q.includes('यात्रा')) {
    return 'traveler';
  }
  if (q.includes('school') || q.includes('college') || q.includes('student') || q.includes('exam') || q.includes('holiday') || q.includes('విద్యార్థి') || q.includes('బడి') || q.includes('स्कूल') || q.includes('छात्र')) {
    return 'student';
  }
  return currentRole;
}

export async function generateAIAdvisory(req: AIAdvisoryRequest): Promise<AIAdvisoryResponse> {
  const lang = req.language || 'en';
  const detectedRole = detectRoleFromQuery(req.userQuery, req.userRole || 'general');
  const targetLoc = (req.lat && req.lon && req.currentLocation)
    ? { name: req.currentLocation, lat: req.lat, lon: req.lon }
    : detectLocationFromQuery(req.userQuery, req.currentLocation || 'Visakhapatnam');

  // 1. Fetch Real-time Weather & Risk Analysis
  const weather = await fetchLiveWeatherData(targetLoc.lat, targetLoc.lon, targetLoc.name);
  const risk = assessDisasterRisk({
    temp: weather.temperature,
    humidity: weather.humidity,
    precipitation: weather.precipitation,
    windSpeed: weather.windSpeed,
    windGusts: weather.windGusts,
    pressure: weather.pressure,
    weatherCode: weather.weatherCode,
    locationName: targetLoc.name
  });

  // 2. RAG Knowledge Extraction
  const rag = retrieveRAGContext(req.userQuery, targetLoc.name, detectedRole);

  const weatherSnippet = {
    location: targetLoc.name,
    temp: weather.temperature,
    feelsLike: weather.feelsLike,
    condition: weather.weatherDescription,
    rain: weather.precipitation,
    wind: weather.windSpeed,
    humidity: weather.humidity
  };

  // 3. Construct Gemini Prompt
  const ai = getAIClient();

  if (ai) {
    try {
      const languageInstructions = lang === 'te'
        ? "Respond in natural, high-quality Telugu (తెలుగు). Ensure clear terminology for weather and safety precautions."
        : lang === 'hi'
        ? "Respond in natural, high-quality Hindi (हिंदी). Ensure clear terminology for weather and safety precautions."
        : "Respond in clear, professional English.";

      const prompt = `You are "AskTheSky AI", an advanced, trustworthy AI-Powered Weather & Disaster Advisory System built for the Smart India Hackathon (SIH Project).
Core Motto: "Ask the Sky. Know the Risk. Stay Safe."

User Query: "${req.userQuery}"
User Role: ${detectedRole.toUpperCase()}
Selected Language: ${lang.toUpperCase()}

CURRENT OBSERVED METEOROLOGICAL DATA for ${targetLoc.name}:
- Temperature: ${weather.temperature}°C (Feels like: ${weather.feelsLike}°C)
- Precipitation (24h): ${weather.precipitation} mm (${weather.precipitationProbability}% chance)
- Wind Speed: ${weather.windSpeed} km/h (Gusts: ${weather.windGusts} km/h)
- Humidity: ${weather.humidity}% | Pressure: ${weather.pressure} hPa | Cloud Cover: ${weather.cloudCover}%
- Weather Condition: ${weather.weatherDescription} (WMO Code ${weather.weatherCode})
- Automated Risk Engine Status: ${risk.level.toUpperCase()} (Risk Score: ${risk.score}/100)
- Primary Threat: ${risk.primaryThreat}

OFFICIAL RETRIEVED RAG KNOWLEDGE BASE & PROTOCOLS (NDMA / IMD / INCOIS):
${rag.contextText}

INSTRUCTIONS:
1. ${languageInstructions}
2. Directly answer the user's intent with precision regarding the location and time.
3. State the exact Risk Level (${risk.level.toUpperCase()}) and why.
4. Give 3-4 bulleted, highly actionable safety and operational instructions specifically customized for a ${detectedRole.toUpperCase()}.
5. Include a brief section titled "Explainable Risk Factors" showing the physical parameters (rainfall, wind, temperature) that determined this risk level.
6. Provide a clean, formatted Markdown output without excessive fluff.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are AskTheSky AI, an official and highly accurate weather and disaster advisory engine. Be factual, life-saving, clear, and reassuring."
        }
      });

      const fullText = response.text || '';

      // Generate a short speech-optimized summary
      const speechPrompt = `Summarize the following weather advisory into 2 short, crisp, spoken sentences suitable for voice readout in ${lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'}:\n${fullText.slice(0, 500)}`;
      
      let speechText = '';
      try {
        const speechRes = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: speechPrompt
        });
        speechText = speechRes.text?.trim() || '';
      } catch (e) {
        speechText = `${risk.headline} for ${targetLoc.name}. Temperature is ${weather.temperature}°C with ${weather.weatherDescription}. Risk level is ${risk.level.toUpperCase()}.`;
      }

      return {
        answerText: fullText,
        speechText: speechText || `${risk.headline} for ${targetLoc.name}. Risk level: ${risk.level}.`,
        detectedLocation: targetLoc.name,
        targetRole: detectedRole,
        language: lang,
        riskAssessment: risk,
        weatherSnippet,
        ragCitations: rag.citations,
        isRealAI: true
      };
    } catch (error) {
      console.warn('Gemini API call failed, using intelligent deterministic fallback:', error);
    }
  }

  // Fallback Intelligent Advisor (Deterministic RAG Synthesis)
  const roleAdviceList = risk.roleSpecificAdvice[detectedRole] || risk.roleSpecificAdvice.general;
  
  let localizedAnswer = '';
  let speechText = '';

  if (lang === 'te') {
    localizedAnswer = `### 🌤️ AskTheSky AI విశ్లేషణ: **${targetLoc.name}**\n\n` +
      `**ప్రస్తుత వాతావరణం:** ${weather.temperature}°C (${weather.weatherDescription}), వర్షపాతం: ${weather.precipitation}mm, గాలి వేగం: ${weather.windSpeed} km/h (ఈదురు గాలులు: ${weather.windGusts} km/h).\n\n` +
      `⚠️ **రిస్క్ స్థాయి:** **${risk.level === 'severe' ? 'తీవ్రమైన ప్రమాదం (Severe)' : risk.level === 'high' ? 'అధిక రిస్క్ (High)' : risk.level === 'moderate' ? 'మధ్యస్థ రిస్క్ (Moderate)' : 'సురక్షితం (Low)'}** (స్కోర్: ${risk.score}/100)\n\n` +
      `**${detectedRole === 'farmer' ? 'రైతులకు' : detectedRole === 'fisherman' ? 'మత్స్యకారులకు' : detectedRole === 'traveler' ? 'ప్రయాణికులకు' : detectedRole === 'student' ? 'పాఠశాలలు & విద్యార్థులకు' : 'పౌరులకు'} సూచించిన భద్రతా చర్యలు:**\n` +
      roleAdviceList.map(a => `- ${a}`).join('\n') + `\n\n` +
      `**Explainable AI విశ్లేషణ:** వర్షపాతం తీవ్రత (${weather.precipitation}mm), గాలి వేగం (${weather.windSpeed}km/h) ఆధారంగా ఈ రిస్క్ లెవల్ నిర్ణయించబడింది.`;

    speechText = `${targetLoc.name} లో రిస్క్ స్థాయి ${risk.level.toUpperCase()}. ఉష్ణోగ్రత ${weather.temperature} డిగ్రీలు. ${risk.safetyActions[0] || 'సురక్షితంగా ఉండండి'}.`;
  } else if (lang === 'hi') {
    localizedAnswer = `### 🌤️ AskTheSky AI मौसम एवं आपदा विश्लेषण: **${targetLoc.name}**\n\n` +
      `**वर्तमान मौसम स्थिति:** ${weather.temperature}°C (${weather.weatherDescription}), वर्षा: ${weather.precipitation}mm, हवा की गति: ${weather.windSpeed} km/h (झोंके: ${weather.windGusts} km/h).\n\n` +
      `⚠️ **जोखिम स्तर:** **${risk.level === 'severe' ? 'गंभीर आपातकाल (Severe)' : risk.level === 'high' ? 'उच्च जोखिम (High)' : risk.level === 'moderate' ? 'मध्यम जोखिम (Moderate)' : 'सुरक्षित (Low)'}** (स्कोर: ${risk.score}/100)\n\n` +
      `**${detectedRole === 'farmer' ? 'किसानों के लिए' : detectedRole === 'fisherman' ? 'मछुआरों के लिए' : detectedRole === 'traveler' ? 'यात्रियों के लिए' : detectedRole === 'student' ? 'छात्रों और स्कूलों के लिए' : 'नागरिकों के लिए'} अनुशंसित सुरक्षा कदम:**\n` +
      roleAdviceList.map(a => `- ${a}`).join('\n') + `\n\n` +
      `**Explainable AI विश्लेषण:** वर्षा की तीव्रता (${weather.precipitation}mm), हवा की गति (${weather.windSpeed}km/h) और तापमान के आधार पर जोखिम स्तर निर्धारित किया गया है।`;

    speechText = `${targetLoc.name} के लिए जोखिम स्तर ${risk.level.toUpperCase()} है। तापमान ${weather.temperature} डिग्री सेल्सियस है। ${risk.safetyActions[0] || 'कृपया सुरक्षित रहें'}।`;
  } else {
    localizedAnswer = `### 🌤️ AskTheSky AI Meteorological & Disaster Advisory: **${targetLoc.name}**\n\n` +
      `**Current Observed Conditions:** ${weather.temperature}°C (${weather.weatherDescription}), Rainfall: ${weather.precipitation}mm, Wind: ${weather.windSpeed} km/h (Gusts: ${weather.windGusts} km/h), Humidity: ${weather.humidity}%.\n\n` +
      `⚠️ **Disaster Risk Level:** **${risk.level.toUpperCase()} ALERT** (Risk Score: ${risk.score}/100)\n` +
      `*Primary Threat:* ${risk.primaryThreat}\n\n` +
      `**Actionable Protocols for ${detectedRole.toUpperCase()}:**\n` +
      roleAdviceList.map(a => `- ${a}`).join('\n') + `\n\n` +
      `**Explainable AI Factors:**\n${risk.explainableAI}\n\n` +
      `*Safety Guidance:* ${risk.safetyActions[0] || 'Follow standard local emergency directives.'}`;

    speechText = `Advisory for ${targetLoc.name}. Risk level is ${risk.level.toUpperCase()} with ${weather.temperature} degrees and ${weather.weatherDescription}. ${risk.safetyActions[0] || 'Stay safe'}.`;
  }

  return {
    answerText: localizedAnswer,
    speechText,
    detectedLocation: targetLoc.name,
    targetRole: detectedRole,
    language: lang,
    riskAssessment: risk,
    weatherSnippet,
    ragCitations: rag.citations,
    isRealAI: false
  };
}
