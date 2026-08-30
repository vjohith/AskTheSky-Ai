import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WeatherDashboard } from './components/WeatherDashboard';
import { AIChatVoice } from './components/AIChatVoice';
import { InteractiveRiskMap } from './components/InteractiveRiskMap';
import { EmergencyHub } from './components/EmergencyHub';
import { HistoricalComparison } from './components/HistoricalComparison';
import { UserVault } from './components/UserVault';
import { LetThemKnow } from './components/LetThemKnow';
import { AuthPage } from './components/AuthPage';
import { EmergencyOverlay } from './components/EmergencyOverlay';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { supabase } from './supabaseClient';
import {
  loadChatMessages,
  saveChatMessage,
  clearChatMessages,
  dispatchSOSAlert,
  loadUserProfile
} from './lib/supabaseService';
import {
  WeatherData,
  RiskAssessment,
  OfficialAlert,
  MapMarkerLocation,
  HazardLayerData,
  ChatMessage,
  UserAccount,
  Language,
  UserRole
} from './types';

export function App() {
  // Navigation & Preferences State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [userRole, setUserRole] = useState<UserRole>('general');
  const [user, setUser] = useState<UserAccount | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [emergencyOverlayOpen, setEmergencyOverlayOpen] = useState<boolean>(false);

  // Weather & Risk State
  const [locationName, setLocationName] = useState<string>('Visakhapatnam, Andhra Pradesh');
  const [lat, setLat] = useState<number>(17.6868);
  const [lon, setLon] = useState<number>(83.2185);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [alerts, setAlerts] = useState<OfficialAlert[]>([]);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);

  // Map & Hazard Layers
  const [mapMarkers, setMapMarkers] = useState<MapMarkerLocation[]>([]);
  const [hazardLayers, setHazardLayers] = useState<HazardLayerData | null>(null);
  const [selectedMapMarker, setSelectedMapMarker] = useState<MapMarkerLocation | null>(null);

  // Chat & AI State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);

  // Safe navigation handler with Supabase Session Verification for Private Pages
  const handleSelectTab = async (targetTab: string) => {
    // Private pages that require a real Supabase session
    const privatePages = ['vault'];

    if (privatePages.includes(targetTab)) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // If no session, redirect to /login
          setCurrentTab('auth');
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', '/login');
          }
          return;
        }
      } catch (err) {
        console.warn('Session verification error:', err);
        setCurrentTab('auth');
        if (typeof window !== 'undefined' && window.history) {
          window.history.pushState({}, '', '/login');
        }
        return;
      }
    }

    setCurrentTab(targetTab);
    if (typeof window !== 'undefined' && window.history) {
      if (targetTab === 'auth') {
        window.history.pushState({}, '', '/login');
      } else if (targetTab === 'dashboard') {
        window.history.pushState({}, '', '/');
      } else {
        window.history.pushState({}, '', `/${targetTab}`);
      }
    }
  };

  // Initial Data Fetch & Supabase Auth Session Initialization
  useEffect(() => {
    // 1. Initialize Supabase Auth Session and Protect Routes
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

        if (session) {
          const sbUser = session.user;
          const restoredUser: UserAccount = {
            id: sbUser.id,
            email: sbUser.email || '',
            name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Citizen',
            role: (sbUser.user_metadata?.role as UserRole) || 'general',
            language: (sbUser.user_metadata?.language as Language) || 'en',
            phone: sbUser.user_metadata?.phone || '',
            savedLocations: [],
            alertPreferences: { smsAlerts: true, emailAlerts: true, highRiskOnly: false, voiceAnnouncements: true },
            createdAt: sbUser.created_at || new Date().toISOString()
          };
          setUser(restoredUser);
          if (restoredUser.role) setUserRole(restoredUser.role);
          if (restoredUser.language) setLanguage(restoredUser.language);

          if (currentPath === '/login' || currentPath === '/auth') {
            setCurrentTab('dashboard');
            window.history.pushState({}, '', '/');
          }
        } else {
          setUser(null);
          // If accessing /login, /auth, or a private page like /vault with no session, redirect to /login
          if (currentPath === '/login' || currentPath === '/auth' || currentPath === '/vault') {
            setCurrentTab('auth');
            if (currentPath !== '/login') {
              window.history.pushState({}, '', '/login');
            }
          }
        }
      } catch (e) {
        console.warn('Supabase getSession init error:', e);
      }
    };

    initAuth();

    // 2. Subscribe to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const sbUser = session.user;
        setUser({
          id: sbUser.id,
          email: sbUser.email || '',
          name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Citizen',
          role: (sbUser.user_metadata?.role as UserRole) || 'general',
          language: (sbUser.user_metadata?.language as Language) || 'en',
          phone: sbUser.user_metadata?.phone || '',
          savedLocations: [],
          alertPreferences: { smsAlerts: true, emailAlerts: true, highRiskOnly: false, voiceAnnouncements: true },
          createdAt: sbUser.created_at || new Date().toISOString()
        });
      } else {
        setUser(null);
      }
    });

    // 3. Handle browser back/forward navigation
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/login' || path === '/auth') {
        setCurrentTab('auth');
      } else if (path === '/vault') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setCurrentTab('auth');
            window.history.pushState({}, '', '/login');
          } else {
            setCurrentTab('vault');
          }
        });
      } else if (path === '/' || path === '') {
        setCurrentTab('dashboard');
      } else {
        const tab = path.replace('/', '');
        setCurrentTab(tab || 'dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);

    // 4. Fetch Map Markers & Hazards
    fetch('/api/weather/map-markers')
      .then(res => res.json())
      .then(data => {
        if (data.markers) {
          setMapMarkers(data.markers);
          setSelectedMapMarker(data.markers[0]);
        }
      })
      .catch(err => console.warn('Map markers error:', err));

    fetch('/api/weather/hazard-layers')
      .then(res => res.json())
      .then(data => {
        if (data.layers) setHazardLayers(data.layers);
      })
      .catch(err => console.warn('Hazard layers error:', err));

    // 5. Fetch Chat History from Supabase
    loadChatMessages(user?.id)
      .then(messages => {
        if (messages && messages.length > 0) {
          setChatMessages(messages);
        }
      })
      .catch(err => console.warn('Chat history error:', err));

    // 6. Fetch Default Weather
    fetchWeatherForCoords(17.6868, 83.2185, 'Visakhapatnam, Andhra Pradesh');

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fetch Weather & Risk for Coordinates
  const fetchWeatherForCoords = async (latitude: number, longitude: number, name: string) => {
    setLoadingWeather(true);
    setLat(latitude);
    setLon(longitude);
    setLocationName(name);

    try {
      const weatherUrl = `/api/weather/current?lat=${latitude}&lon=${longitude}&name=${encodeURIComponent(name)}`;
      const res = await fetch(weatherUrl);
      const data = await res.json();

      if (data.weather && data.risk) {
        setWeather(data.weather);
        setRisk(data.risk);
      }

      // Fetch active alerts for location
      const alertRes = await fetch(`/api/weather/alerts?location=${encodeURIComponent(name)}`);
      const alertData = await alertRes.json();
      if (alertData.alerts) {
        setAlerts(alertData.alerts);
      }
    } catch (e) {
      console.error('Failed to load weather:', e);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Search Location by Name
  const handleSearchLocation = async (query: string) => {
    try {
      setLoadingWeather(true);
      const res = await fetch(`/api/weather/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const top = data.results[0];
        const fullName = top.state ? `${top.name}, ${top.state}` : top.name;
        await fetchWeatherForCoords(top.lat, top.lon, fullName);
      }
    } catch (e) {
      console.warn('Search location error:', e);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Locate User via GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeatherForCoords(latitude, longitude, 'My GPS Coordinates');
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        alert('Could not obtain GPS location. Defaulting to coastal radar.');
      }
    );
  };

  // AI Chat Query Submission
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Optimistically append user message
    const tempUserMsg: ChatMessage = {
      id: 'msg_local_' + Date.now(),
      userId: user?.id || 'demo-user-1',
      sender: 'user',
      text: queryText,
      timestamp: new Date().toISOString(),
      language
    };
    setChatMessages(prev => [...prev, tempUserMsg]);
    setLoadingAI(true);

    try {
      const res = await fetch('/api/ai/advisory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'demo-user-1'
        },
        body: JSON.stringify({
          userQuery: queryText,
          userRole,
          language,
          currentLocation: locationName,
          lat,
          lon
        })
      });

      const advisory = await res.json();

      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        userId: user?.id || 'demo-user-1',
        sender: 'ai',
        text: advisory.answerText,
        speechText: advisory.speechText,
        timestamp: new Date().toISOString(),
        language,
        detectedLocation: advisory.detectedLocation,
        riskAssessment: advisory.riskAssessment,
        weatherSnippet: advisory.weatherSnippet,
        ragCitations: advisory.ragCitations
      };

      setChatMessages(prev => [...prev, aiMsg]);

      // Persist user and AI messages to Supabase
      if (user?.id) {
        saveChatMessage(tempUserMsg, user.id);
        saveChatMessage(aiMsg, user.id);
      }

      // If location changed in response, update weather in background
      if (advisory.detectedLocation && advisory.detectedLocation !== locationName) {
        handleSearchLocation(advisory.detectedLocation);
      }
    } catch (e) {
      console.error('AI chat failed:', e);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        userId: user?.id || 'demo-user-1',
        sender: 'ai',
        text: 'Sorry, I encountered an issue reaching the weather advisory engine. Please retry in a moment.',
        timestamp: new Date().toISOString(),
        language
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChatMessages(user?.id);
      await fetch('/api/chat-history', {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || 'demo-user-1' }
      });
      setChatMessages([]);
    } catch (e) {
      console.warn(e);
    }
  };

  // Dispatch SOS Alert
  const handleDispatchSOS = async (hazard: string, msg: string): Promise<boolean> => {
    try {
      const success = await dispatchSOSAlert({
        userId: user?.id,
        userName: user?.name || 'Citizen User',
        location: locationName,
        lat,
        lon,
        hazardType: hazard,
        message: msg
      });
      return success;
    } catch (e) {
      console.error('SOS dispatch error:', e);
      return false;
    }
  };

  const handleAskAIAboutLocation = () => {
    handleSelectTab('aiChat');
    const prompt = `Give me a full meteorological safety advisory and disaster risk analysis for ${locationName}.`;
    handleSendMessage(prompt);
  };

  const handleGenerateAdvisoryForMap = (locName: string) => {
    handleSelectTab('aiChat');
    const prompt = `Provide an official emergency advisory for ${locName} for a ${userRole}.`;
    handleSendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Deep Blue & Indigo Ambient Background Lighting Orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-10 w-[400px] h-[300px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleSelectTab}
        language={language}
        setLanguage={setLanguage}
        userRole={userRole}
        setUserRole={setUserRole}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onTriggerEmergencyMode={() => setEmergencyOverlayOpen(true)}
        activeAlertCount={alerts.length}
      />

      {/* Main App Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <WeatherDashboard
            weather={weather}
            risk={risk}
            alerts={alerts}
            language={language}
            userRole={userRole}
            onSearchLocation={handleSearchLocation}
            onLocateMe={handleLocateMe}
            onSelectRole={setUserRole}
            loading={loadingWeather}
            onAskAIAboutLocation={handleAskAIAboutLocation}
            onNavigateLetThemKnow={() => handleSelectTab('letThemKnow')}
          />
        )}

        {currentTab === 'aiChat' && (
          <AIChatVoice
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            loading={loadingAI}
            language={language}
            userRole={userRole}
            currentLocationName={locationName}
            onClearHistory={handleClearChat}
          />
        )}

        {currentTab === 'map' && (
          <InteractiveRiskMap
            markers={mapMarkers}
            hazardLayers={hazardLayers}
            selectedLocation={selectedMapMarker}
            onSelectLocation={(loc) => {
              setSelectedMapMarker(loc);
              fetchWeatherForCoords(loc.lat, loc.lon, `${loc.name}, ${loc.state}`);
            }}
            language={language}
            onGenerateAdvisory={handleGenerateAdvisoryForMap}
            centerLat={lat}
            centerLon={lon}
          />
        )}

        {currentTab === 'letThemKnow' && (
          <LetThemKnow
            language={language}
            userRole={userRole}
            currentLocationName={locationName}
            currentLat={lat}
            currentLon={lon}
            userName={user?.name || 'Citizen User'}
            onSelectLocationForWeather={(locName, targetLat, targetLon) => {
              if (targetLat && targetLon) {
                fetchWeatherForCoords(targetLat, targetLon, locName);
              } else {
                handleSearchLocation(locName);
              }
              handleSelectTab('dashboard');
            }}
          />
        )}

        {currentTab === 'emergency' && (
          <EmergencyHub
            language={language}
            currentLat={lat}
            currentLon={lon}
            currentLocationName={locationName}
            onDispatchSOS={handleDispatchSOS}
          />
        )}

        {currentTab === 'history' && (
          <HistoricalComparison
            weather={weather}
            language={language}
          />
        )}

        {currentTab === 'vault' && (
          <UserVault
            user={user}
            language={language}
            onUpdateRole={setUserRole}
            onUpdateLanguage={setLanguage}
            onSelectSavedLocation={(savedLat, savedLon, savedName) => {
              fetchWeatherForCoords(savedLat, savedLon, savedName);
              handleSelectTab('dashboard');
            }}
          />
        )}

        {currentTab === 'auth' && (
          <AuthPage
            user={user}
            language={language}
            onLoginSuccess={(u) => {
              setUser(u);
              if (u.role) setUserRole(u.role);
              if (u.language) setLanguage(u.language);
              handleSelectTab('dashboard');
            }}
            onLogout={async () => {
              await supabase.auth.signOut().catch(() => {});
              setUser(null);
              handleSelectTab('auth');
            }}
            onNavigateTab={(tab) => handleSelectTab(tab)}
          />
        )}
      </main>

      {/* High-Urgency Emergency Overlay Modal */}
      <EmergencyOverlay
        isOpen={emergencyOverlayOpen}
        onClose={() => setEmergencyOverlayOpen(false)}
        language={language}
        lat={lat}
        lon={lon}
        locationName={locationName}
        onDispatchSOS={handleDispatchSOS}
      />

      {/* Citizen Authentication & Profile Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        user={user}
        onLoginSuccess={(u) => {
          setUser(u);
          handleSelectTab('dashboard');
        }}
        language={language}
      />

      {/* Footer */}
      <Footer language={language} />
    </div>
  );
}

export default App;
