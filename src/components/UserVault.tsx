import React, { useState, useEffect, useRef } from 'react';
import {
  FolderLock,
  Upload,
  FileText,
  Trash2,
  Download,
  MapPin,
  Plus,
  Shield,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Settings,
  Bell,
  HardDrive
} from 'lucide-react';
import { UserFile, SavedLocation, Language, UserRole, UserAccount, RAGDocument } from '../types';
import { i18n } from '../i18n';
import {
  loadSavedLocations,
  createSavedLocation,
  deleteSavedLocation,
  loadVaultFiles,
  deleteVaultFile,
  createVaultFileRecord
} from '../lib/supabaseService';

interface UserVaultProps {
  user: UserAccount | null;
  language: Language;
  onUpdateRole: (role: UserRole) => void;
  onUpdateLanguage: (lang: Language) => void;
  onSelectSavedLocation: (lat: number, lon: number, name: string) => void;
}

export const UserVault: React.FC<UserVaultProps> = ({
  user,
  language,
  onUpdateRole,
  onUpdateLanguage,
  onSelectSavedLocation
}) => {
  const t = i18n[language];
  const [files, setFiles] = useState<UserFile[]>([]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [ragDocs, setRagDocs] = useState<RAGDocument[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>('disaster_plan');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // New location modal state
  const [newLocName, setNewLocName] = useState('');
  const [newLocLat, setNewLocLat] = useState('');
  const [newLocLon, setNewLocLon] = useState('');
  const [newLocCustomName, setNewLocCustomName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const data = await loadVaultFiles(user?.id);
      setFiles(data);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchSavedLocations = async () => {
    try {
      const data = await loadSavedLocations(user?.id);
      setSavedLocations(data);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchRAGDocs = async () => {
    try {
      const res = await fetch('/api/rag/documents');
      const data = await res.json();
      if (data.documents) setRagDocs(data.documents);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchSavedLocations();
    fetchRAGDocs();
  }, [user]);

  const handleFileUpload = async (selectedFile: File) => {
    if (!selectedFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', uploadCategory);

    try {
      // 1. Upload to storage / server
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'x-user-id': user?.id || 'demo-user-1' },
        body: formData
      });

      if (res.ok) {
        const uploadedData = await res.json();
        if (uploadedData.file && user?.id) {
          // Record in Supabase
          await createVaultFileRecord({
            userId: user.id,
            originalName: uploadedData.file.originalName || selectedFile.name,
            fileName: uploadedData.file.fileName || selectedFile.name,
            mimeType: uploadedData.file.mimeType || selectedFile.type || 'application/octet-stream',
            size: uploadedData.file.size || selectedFile.size,
            category: uploadCategory
          });
        }
        await fetchFiles();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const success = await deleteVaultFile(fileId);
      if (success) {
        setFiles(files.filter(f => f.id !== fileId));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocLat || !newLocLon) return;

    try {
      const newLoc = await createSavedLocation({
        userId: user?.id,
        name: newLocName,
        customName: newLocCustomName || newLocName,
        lat: parseFloat(newLocLat),
        lon: parseFloat(newLocLon),
        alertThreshold: 'moderate'
      });

      if (newLoc) {
        setNewLocName('');
        setNewLocLat('');
        setNewLocLon('');
        setNewLocCustomName('');
        await fetchSavedLocations();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteLocation = async (locId: string) => {
    try {
      const success = await deleteSavedLocation(locId);
      if (success) {
        setSavedLocations(savedLocations.filter(l => l.id !== locId));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[#0c1633] border border-blue-900/60 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-wider text-xs">
            <FolderLock className="w-4 h-4" />
            <span>Secure Citizen Hub</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">{t.vault.title}</h2>
          <p className="text-xs text-blue-200/80">{t.vault.subtitle}</p>
        </div>

        {/* User Badge */}
        <div className="bg-[#081026] border border-blue-900/60 rounded-2xl p-4 flex items-center gap-3 shadow-inner">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-base shadow-md">
            {user ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-xs">
            <span className="font-bold text-white block font-display">{user ? user.name : 'Citizen User'}</span>
            <span className="text-blue-300/80 capitalize">Role: {user?.role || 'General Public'}</span>
          </div>
        </div>
      </div>

      {/* Grid: Monitored Locations & Document Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monitored Locations */}
        <div className="bg-[#0c1633] border border-blue-900/60 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              {t.vault.savedLocations}
            </h3>
            <span className="text-xs text-sky-300 bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-800">
              {savedLocations.length} Tracked
            </span>
          </div>

          {/* Locations list */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {savedLocations.map((loc) => (
              <div
                key={loc.id}
                className="bg-[#081026] border border-blue-900/50 hover:border-blue-700/60 rounded-2xl p-3.5 flex items-center justify-between transition-colors shadow-inner"
              >
                <div
                  className="cursor-pointer flex-1"
                  onClick={() => onSelectSavedLocation(loc.lat, loc.lon, loc.name)}
                >
                  <span className="text-xs font-bold text-white hover:text-sky-300 block font-display">
                    {loc.customName || loc.name}
                  </span>
                  <span className="text-[11px] text-blue-300/80">
                    {loc.name} • <span className="font-mono text-sky-400">{loc.lat.toFixed(2)}°N, {loc.lon.toFixed(2)}°E</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectSavedLocation(loc.lat, loc.lon, loc.name)}
                    className="text-[11px] bg-blue-900/60 hover:bg-blue-800 text-sky-300 border border-blue-700/60 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                  >
                    View Radar
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="p-1.5 text-blue-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove Location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Location Form */}
          <form onSubmit={handleAddLocation} className="pt-3 border-t border-blue-900/60 space-y-2.5">
            <span className="text-xs font-semibold text-blue-200 block">{t.vault.addLocation}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                placeholder="City/Village Name (e.g., Kakinada)"
                className="bg-[#081026] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 shadow-inner"
                required
              />
              <input
                type="text"
                value={newLocCustomName}
                onChange={(e) => setNewLocCustomName(e.target.value)}
                placeholder="Label (e.g., Coastal Farm / Home)"
                className="bg-[#081026] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 shadow-inner"
              />
              <input
                type="number"
                step="any"
                value={newLocLat}
                onChange={(e) => setNewLocLat(e.target.value)}
                placeholder="Latitude (e.g., 16.989)"
                className="bg-[#081026] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 shadow-inner"
                required
              />
              <input
                type="number"
                step="any"
                value={newLocLon}
                onChange={(e) => setNewLocLon(e.target.value)}
                placeholder="Longitude (e.g., 82.247)"
                className="bg-[#081026] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 shadow-inner"
                required
              />
            </div>
            <button
              id="add-saved-loc-btn"
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-950/50 border border-blue-400/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Track New Location</span>
            </button>
          </form>
        </div>

        {/* Disaster Document Vault & File Upload */}
        <div className="bg-[#0c1633] border border-blue-900/60 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-sky-400" />
              {t.vault.fileStorage}
            </h3>
            <span className="text-xs text-blue-300/80">{files.length} Stored</span>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-sky-400 bg-blue-950/70'
                : 'border-blue-800/80 hover:border-blue-600 bg-[#081026] shadow-inner'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-sky-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-white font-display">
              {uploading ? 'Encrypting & Storing Document...' : t.vault.uploadPrompt}
            </p>
            <p className="text-[10px] text-blue-300/70 mt-1">
              Supports PDFs, damage photos, insurance policies, evacuation checklists (Max 15MB)
            </p>
          </div>

          {/* File Category Picker */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-blue-300/80 font-medium">Category:</span>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="bg-[#081026] border border-blue-800/80 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-400 shadow-inner cursor-pointer"
            >
              <option value="disaster_plan">🛡️ Emergency Preparedness Plan</option>
              <option value="crop_damage">🌾 Crop Damage Evidence</option>
              <option value="insurance">📑 Disaster Insurance Claim</option>
              <option value="medical_record">🏥 Emergency Medical File</option>
            </select>
          </div>

          {/* Uploaded Files List */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-[#081026] border border-blue-900/50 rounded-2xl p-3 flex items-center justify-between text-xs shadow-inner"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-white truncate block">{file.originalName}</span>
                    <span className="text-[10px] text-blue-300/70">
                      {formatFileSize(file.size)} • {file.category.replace('_', ' ')} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`/api/files/download/${file.id}`}
                    download={file.originalName}
                    className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-blue-900/50 rounded-lg transition-colors cursor-pointer"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="p-1.5 text-blue-400 hover:text-rose-400 hover:bg-blue-900/50 rounded-lg transition-colors cursor-pointer"
                    title="Delete File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Official RAG Knowledge Repository Explorer */}
      <div className="bg-[#0c1633] border border-blue-900/60 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              Official NDMA & IMD Disaster Knowledge Base (RAG Corpus)
            </h3>
            <p className="text-xs text-blue-200/80">
              Directly synthesized by AskTheSky AI for factual ground-truth advisories.
            </p>
          </div>
          <span className="text-xs font-mono text-sky-300 bg-blue-950 border border-blue-800 px-3 py-1 rounded-full">
            {ragDocs.length} Verified SOPs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ragDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#081026] border border-blue-900/50 rounded-2xl p-4 space-y-2 flex flex-col justify-between shadow-inner hover:border-blue-700/60 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-sky-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {doc.hazardType}
                  </span>
                  <span className="text-[10px] text-blue-300/70">{doc.category}</span>
                </div>
                <h4 className="text-xs font-bold text-white font-display">{doc.title}</h4>
                <p className="text-[11px] text-blue-100/90 leading-relaxed line-clamp-3 mt-1">
                  {doc.content}
                </p>
              </div>
              <div className="pt-2 border-t border-blue-900/60 text-[10px] text-blue-300/70 flex items-center justify-between">
                <span>Source: <strong className="text-sky-300">{doc.source}</strong></span>
                <span>Role: {doc.targetRole}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
