import { supabase } from '../supabaseClient';
import {
  SavedLocation,
  UserStoredFile,
  CommunityReport,
  ChatMessage,
  SOSAlert,
  UserAccount,
  RiskLevel
} from '../types';

/**
 * ============================================================================
 * ASKTHESKY AI - SUPABASE CRUD SERVICE LAYER
 * ============================================================================
 * Full typed implementations for:
 * 1. Saved Monitored Locations (Create, Read, Update, Delete)
 * 2. Emergency Disaster Vault Files (Create, Read, Delete)
 * 3. Community Disaster Reports & Votes (Create, Read, Update, Delete, Vote)
 * 4. AI Chat History (Create, Read, Clear)
 * 5. Emergency SOS Alerts (Create, Read)
 * 6. User Profiles (Read, Update)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// Helper to get active Supabase user ID safely
// ----------------------------------------------------------------------------
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (err) {
    console.warn('Error fetching Supabase session:', err);
    return null;
  }
};

// ============================================================================
// 1. SAVED LOCATIONS (CRUD)
// ============================================================================

/**
 * Load user's saved monitored locations from Supabase
 */
export const loadSavedLocations = async (userId?: string): Promise<SavedLocation[]> => {
  const uid = userId || (await getCurrentUserId());
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from('saved_locations')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase loadSavedLocations error:', error.message);
      // Fallback to backend API
      const res = await fetch('/api/saved-locations', { headers: { 'x-user-id': uid } });
      const fallback = await res.json();
      return fallback.locations || [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      customName: row.custom_name,
      lat: Number(row.lat),
      lon: Number(row.lon),
      alertThreshold: row.alert_threshold as RiskLevel,
      createdAt: row.created_at
    }));
  } catch (e) {
    console.error('loadSavedLocations exception:', e);
    return [];
  }
};

/**
 * Create a new monitored location in Supabase
 */
export const createSavedLocation = async (params: {
  name: string;
  customName?: string;
  lat: number;
  lon: number;
  alertThreshold?: string;
  userId?: string;
}): Promise<SavedLocation | null> => {
  const uid = params.userId || (await getCurrentUserId());
  if (!uid) {
    console.warn('Cannot create saved location: No authenticated user.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('saved_locations')
      .insert({
        user_id: uid,
        name: params.name,
        custom_name: params.customName || params.name,
        lat: params.lat,
        lon: params.lon,
        alert_threshold: params.alertThreshold || 'moderate'
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase createSavedLocation error:', error.message);
      // Fallback to backend API
      const res = await fetch('/api/saved-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
        body: JSON.stringify(params)
      });
      const fallback = await res.json();
      return fallback.location || null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      customName: data.custom_name,
      lat: Number(data.lat),
      lon: Number(data.lon),
      alertThreshold: data.alert_threshold as RiskLevel,
      createdAt: data.created_at
    };
  } catch (e) {
    console.error('createSavedLocation exception:', e);
    return null;
  }
};

/**
 * Update an existing saved location
 */
export const updateSavedLocation = async (
  locationId: string,
  updates: Partial<SavedLocation>
): Promise<boolean> => {
  try {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.customName !== undefined) payload.custom_name = updates.customName;
    if (updates.lat !== undefined) payload.lat = updates.lat;
    if (updates.lon !== undefined) payload.lon = updates.lon;
    if (updates.alertThreshold !== undefined) payload.alert_threshold = updates.alertThreshold;

    const { error } = await supabase
      .from('saved_locations')
      .update(payload)
      .eq('id', locationId);

    if (error) {
      console.warn('Supabase updateSavedLocation error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('updateSavedLocation exception:', e);
    return false;
  }
};

/**
 * Delete a saved location
 */
export const deleteSavedLocation = async (locationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('saved_locations')
      .delete()
      .eq('id', locationId);

    if (error) {
      console.warn('Supabase deleteSavedLocation error:', error.message);
      // Fallback
      await fetch(`/api/saved-locations/${locationId}`, { method: 'DELETE' });
      return true;
    }
    return true;
  } catch (e) {
    console.error('deleteSavedLocation exception:', e);
    return false;
  }
};


// ============================================================================
// 2. DISASTER VAULT FILES (CRUD)
// ============================================================================

/**
 * Load user's emergency files and documents
 */
export const loadVaultFiles = async (userId?: string): Promise<UserStoredFile[]> => {
  const uid = userId || (await getCurrentUserId());
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from('vault_files')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase loadVaultFiles error:', error.message);
      const res = await fetch('/api/files', { headers: { 'x-user-id': uid } });
      const fallback = await res.json();
      return fallback.files || [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      originalName: row.original_name,
      fileName: row.file_name,
      mimeType: row.mime_type,
      size: Number(row.size),
      category: row.category,
      url: row.file_url,
      uploadedAt: row.created_at
    }));
  } catch (e) {
    console.error('loadVaultFiles exception:', e);
    return [];
  }
};

/**
 * Save file record in Supabase Vault
 */
export const createVaultFileRecord = async (fileData: {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: string;
  fileUrl?: string;
  userId?: string;
}): Promise<UserStoredFile | null> => {
  const uid = fileData.userId || (await getCurrentUserId());
  if (!uid) return null;

  try {
    const { data, error } = await supabase
      .from('vault_files')
      .insert({
        user_id: uid,
        original_name: fileData.originalName,
        file_name: fileData.fileName,
        mime_type: fileData.mimeType,
        size: fileData.size,
        category: fileData.category,
        file_url: fileData.fileUrl || ''
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase createVaultFileRecord error:', error.message);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      originalName: data.original_name,
      fileName: data.file_name,
      mimeType: data.mime_type,
      size: Number(data.size),
      category: data.category,
      url: data.file_url,
      uploadedAt: data.created_at
    };
  } catch (e) {
    console.error('createVaultFileRecord exception:', e);
    return null;
  }
};

/**
 * Delete a file record from Supabase Vault
 */
export const deleteVaultFile = async (fileId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vault_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      console.warn('Supabase deleteVaultFile error:', error.message);
      await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      return true;
    }
    return true;
  } catch (e) {
    console.error('deleteVaultFile exception:', e);
    return false;
  }
};


// ============================================================================
// 3. COMMUNITY REPORTS (LET THEM KNOW) (CRUD + VOTES)
// ============================================================================

/**
 * Load crowdsourced community reports & alerts with optional filtering
 */
export const loadCommunityReports = async (
  hazardFilter?: string,
  searchQuery?: string,
  currentUserId?: string
): Promise<CommunityReport[]> => {
  try {
    let query = supabase
      .from('community_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (hazardFilter && hazardFilter !== 'all') {
      query = query.eq('hazard_type', hazardFilter);
    }

    if (searchQuery && searchQuery.trim()) {
      query = query.or(`location.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,suggestion.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase loadCommunityReports error:', error.message);
      const url = `/api/community-reports?hazard=${encodeURIComponent(hazardFilter || 'all')}&search=${encodeURIComponent(searchQuery || '')}`;
      const res = await fetch(url);
      const fallback = await res.json();
      return fallback.reports || [];
    }

    const reports: CommunityReport[] = (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || 'Citizen Contributor',
      userRole: r.user_role || 'general',
      location: r.location,
      lat: r.lat ? Number(r.lat) : undefined,
      lon: r.lon ? Number(r.lon) : undefined,
      hazardType: r.hazard_type,
      severity: r.severity,
      title: r.title,
      suggestion: r.suggestion,
      safetyAdvice: r.safety_advice || '',
      upvotes: Number(r.upvotes || 0),
      downvotes: Number(r.downvotes || 0),
      verified: r.verified !== false,
      timestamp: r.created_at
    }));

    // If logged in, fetch user's cast votes
    const uid = currentUserId || (await getCurrentUserId());
    if (uid && reports.length > 0) {
      try {
        const { data: votes } = await supabase
          .from('community_report_votes')
          .select('report_id, vote_type')
          .eq('user_id', uid);

        if (votes) {
          const voteMap = new Map<string, 'up' | 'down'>();
          votes.forEach((v: any) => voteMap.set(v.report_id, v.vote_type));
          reports.forEach(rep => {
            if (voteMap.has(rep.id)) {
              rep.userVoted = voteMap.get(rep.id);
            }
          });
        }
      } catch (err) {
        console.warn('Failed to load user votes:', err);
      }
    }

    return reports;
  } catch (e) {
    console.error('loadCommunityReports exception:', e);
    return [];
  }
};

/**
 * Create a new community report (LetThemKnow) in Supabase
 */
export const createCommunityReport = async (report: {
  userName: string;
  userRole?: string;
  location: string;
  lat?: number;
  lon?: number;
  hazardType: string;
  severity: string;
  title: string;
  suggestion: string;
  safetyAdvice?: string;
  userId?: string;
}): Promise<CommunityReport | null> => {
  const uid = report.userId || (await getCurrentUserId());

  try {
    const { data, error } = await supabase
      .from('community_reports')
      .insert({
        user_id: uid,
        user_name: report.userName || 'Citizen Contributor',
        user_role: report.userRole || 'general',
        location: report.location,
        lat: report.lat,
        lon: report.lon,
        hazard_type: report.hazardType,
        severity: report.severity,
        title: report.title,
        suggestion: report.suggestion,
        safety_advice: report.safetyAdvice || 'Please exercise extreme caution and share this warning with nearby residents.'
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase createCommunityReport error:', error.message);
      // Fallback to backend API
      const res = await fetch('/api/community-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': uid || 'demo-user' },
        body: JSON.stringify(report)
      });
      const fallback = await res.json();
      return fallback.report || null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name,
      userRole: data.user_role,
      location: data.location,
      lat: data.lat ? Number(data.lat) : undefined,
      lon: data.lon ? Number(data.lon) : undefined,
      hazardType: data.hazard_type,
      severity: data.severity,
      title: data.title,
      suggestion: data.suggestion,
      safetyAdvice: data.safety_advice,
      upvotes: Number(data.upvotes || 0),
      downvotes: Number(data.downvotes || 0),
      verified: data.verified !== false,
      timestamp: data.created_at
    };
  } catch (e) {
    console.error('createCommunityReport exception:', e);
    return null;
  }
};

/**
 * Vote on a community report (Upvote / Downvote)
 */
export const voteOnReport = async (
  reportId: string,
  voteType: 'up' | 'down',
  userId?: string
): Promise<boolean> => {
  const uid = userId || (await getCurrentUserId());
  if (!uid) {
    // If not signed in to Supabase, call backend API
    try {
      await fetch(`/api/community-reports/${reportId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: voteType })
      });
      return true;
    } catch {
      return false;
    }
  }

  try {
    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('community_report_votes')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', uid)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote (toggle off)
        await supabase.from('community_report_votes').delete().eq('id', existingVote.id);
        const column = voteType === 'up' ? 'upvotes' : 'downvotes';
        const { data: repData } = await supabase.from('community_reports').select('upvotes, downvotes').eq('id', reportId).single();
        if (repData) {
          const count = Math.max(0, (repData[column] || 1) - 1);
          await supabase.from('community_reports').update({ [column]: count }).eq('id', reportId);
        }
      } else {
        // Switch vote type
        await supabase.from('community_report_votes').update({ vote_type: voteType }).eq('id', existingVote.id);
        const addCol = voteType === 'up' ? 'upvotes' : 'downvotes';
        const subCol = voteType === 'up' ? 'downvotes' : 'upvotes';
        supabase.from('community_reports').select('upvotes, downvotes').eq('id', reportId).single().then(({ data }) => {
          if (data) {
            supabase.from('community_reports').update({
              [addCol]: (data[addCol] || 0) + 1,
              [subCol]: Math.max(0, (data[subCol] || 1) - 1)
            }).eq('id', reportId);
          }
        });
      }
    } else {
      // New vote
      await supabase.from('community_report_votes').insert({
        report_id: reportId,
        user_id: uid,
        vote_type: voteType
      });
      const column = voteType === 'up' ? 'upvotes' : 'downvotes';
      supabase.from('community_reports').select('upvotes, downvotes').eq('id', reportId).single().then(({ data }) => {
        if (data) {
          supabase.from('community_reports').update({ [column]: (data[column] || 0) + 1 }).eq('id', reportId);
        }
      });
    }

    return true;
  } catch (e) {
    console.error('voteOnReport error:', e);
    return false;
  }
};

/**
 * Delete a community report
 */
export const deleteCommunityReport = async (reportId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('community_reports')
      .delete()
      .eq('id', reportId);

    return !error;
  } catch (e) {
    console.error('deleteCommunityReport error:', e);
    return false;
  }
};


// ============================================================================
// 4. AI CHAT MESSAGES & ADVISORIES (CRUD)
// ============================================================================

/**
 * Load chat history from Supabase
 */
export const loadChatMessages = async (userId?: string): Promise<ChatMessage[]> => {
  const uid = userId || (await getCurrentUserId());
  if (!uid) {
    // Load local chat history
    try {
      const res = await fetch('/api/chat-history', { headers: { 'x-user-id': 'demo-user-1' } });
      const data = await res.json();
      return data.messages || [];
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase loadChatMessages error:', error.message);
      const res = await fetch('/api/chat-history', { headers: { 'x-user-id': uid } });
      const fallback = await res.json();
      return fallback.messages || [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      sender: row.sender as 'user' | 'ai',
      text: row.text,
      speechText: row.speech_text,
      language: row.language,
      detectedLocation: row.detected_location,
      weatherSnippet: row.weather_snippet,
      riskAssessment: row.risk_assessment,
      ragCitations: row.rag_citations,
      timestamp: row.created_at
    }));
  } catch (e) {
    console.error('loadChatMessages exception:', e);
    return [];
  }
};

/**
 * Save chat message in Supabase
 */
export const saveChatMessage = async (
  msg: ChatMessage,
  userId?: string
): Promise<boolean> => {
  const uid = userId || (await getCurrentUserId());
  if (!uid) return false;

  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: uid,
        sender: msg.sender,
        text: msg.text,
        speech_text: msg.speechText || null,
        language: msg.language || 'en',
        detected_location: msg.detectedLocation || null,
        weather_snippet: msg.weatherSnippet || null,
        risk_assessment: msg.riskAssessment || null,
        rag_citations: msg.ragCitations || null
      });

    if (error) {
      console.warn('Supabase saveChatMessage error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('saveChatMessage exception:', e);
    return false;
  }
};

/**
 * Clear all chat messages for user
 */
export const clearChatMessages = async (userId?: string): Promise<boolean> => {
  const uid = userId || (await getCurrentUserId());
  if (!uid) return true;

  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', uid);

    return !error;
  } catch (e) {
    console.error('clearChatMessages exception:', e);
    return false;
  }
};


// ============================================================================
// 5. EMERGENCY SOS ALERTS (CREATE & READ)
// ============================================================================

/**
 * Dispatch emergency SOS broadcast to Supabase
 */
export const dispatchSOSAlert = async (alert: {
  userName: string;
  location: string;
  lat?: number;
  lon?: number;
  hazardType: string;
  message: string;
  userId?: string;
}): Promise<boolean> => {
  const uid = alert.userId || (await getCurrentUserId());

  try {
    if (uid) {
      await supabase.from('sos_alerts').insert({
        user_id: uid,
        user_name: alert.userName || 'Citizen in Distress',
        location: alert.location,
        lat: alert.lat,
        lon: alert.lon,
        hazard_type: alert.hazardType,
        message: alert.message,
        status: 'PENDING'
      });
    }

    // Also trigger backend alert service
    await fetch('/api/emergency/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': uid || 'demo-user-1' },
      body: JSON.stringify(alert)
    });

    return true;
  } catch (e) {
    console.error('dispatchSOSAlert exception:', e);
    return false;
  }
};


// ============================================================================
// 6. USER PROFILES & SETTINGS (CRUD)
// ============================================================================

/**
 * Load user profile from Supabase profiles table
 */
export const loadUserProfile = async (userId: string): Promise<Partial<UserAccount> | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      language: data.language,
      phone: data.phone,
      alertPreferences: data.alert_preferences,
      createdAt: data.created_at
    };
  } catch (e) {
    console.warn('loadUserProfile error:', e);
    return null;
  }
};

/**
 * Update user profile in Supabase
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserAccount>
): Promise<boolean> => {
  try {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.name) payload.name = updates.name;
    if (updates.role) payload.role = updates.role;
    if (updates.language) payload.language = updates.language;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.alertPreferences) payload.alert_preferences = updates.alertPreferences;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    return !error;
  } catch (e) {
    console.error('updateUserProfile error:', e);
    return false;
  }
};
