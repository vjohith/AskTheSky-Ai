import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Bot,
  User,
  ShieldAlert,
  Droplets,
  Wind,
  CheckCircle2,
  BookOpen,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { ChatMessage, Language, UserRole, RiskAssessment, WeatherData } from '../types';
import { i18n } from '../i18n';

interface AIChatVoiceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => Promise<void>;
  loading: boolean;
  language: Language;
  userRole: UserRole;
  currentLocationName: string;
  onClearHistory: () => void;
}

export const AIChatVoice: React.FC<AIChatVoiceProps> = ({
  messages,
  onSendMessage,
  loading,
  language,
  userRole,
  currentLocationName,
  onClearHistory
}) => {
  const t = i18n[language];
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Voice Input SpeechRecognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Set language code
      if (language === 'te') recognition.lang = 'te-IN';
      else if (language === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          onSendMessage(transcript);
        }
      };
      recognitionRef.current = recognition;
    }
  }, [language, onSendMessage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported on this browser. Please use text input or Chrome/Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        if (language === 'te') recognitionRef.current.lang = 'te-IN';
        else if (language === 'hi') recognitionRef.current.lang = 'hi-IN';
        else recognitionRef.current.lang = 'en-US';
        recognitionRef.current.start();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Voice Synthesis (Audio Readout)
  const speakText = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;

    if (currentlySpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').slice(0, 400);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (language === 'te') utterance.lang = 'te-IN';
    else if (language === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';

    utterance.rate = 0.95;
    utterance.onend = () => setCurrentlySpeakingId(null);
    utterance.onerror = () => setCurrentlySpeakingId(null);

    setCurrentlySpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !loading) {
      const q = inputText.trim();
      setInputText('');
      onSendMessage(q);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm flex flex-col h-[750px] max-h-[85vh]">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 shadow-lg shadow-cyan-950/60 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">{t.aiChat.title}</h2>
              <span className="bg-cyan-950 text-cyan-300 border border-cyan-800/50 text-[10px] px-2 py-0.5 rounded-full font-mono">
                RAG + Gemini 3.7
              </span>
            </div>
            <p className="text-xs text-slate-400">{t.aiChat.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearHistory}
            className="text-xs text-slate-400 hover:text-slate-200 border border-slate-800 bg-slate-950 px-2.5 py-1.5 rounded-xl transition-colors"
            title="Clear Chat History"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="py-2.5 border-b border-slate-800/60">
        <span className="text-[11px] text-slate-400 font-semibold mb-1 block">
          {t.aiChat.quickPrompts}
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {t.aiChat.prompts.map((promptText, i) => (
            <button
              key={i}
              id={`quick-prompt-${i}`}
              onClick={() => onSendMessage(promptText)}
              disabled={loading}
              className="shrink-0 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 px-3 py-1.5 rounded-xl transition-all text-left max-w-sm truncate"
            >
              💬 {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-cyan-950/50 border border-cyan-800/40 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-slate-200 mb-1">
              Ask anything about weather, cyclones, floods, or crop timing!
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Speak or type in English, Telugu, or Hindi. The AI combines real-time satellite data with NDMA/IMD official protocols.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-xl'
                  }`}
                >
                  {/* Sender Header (AI only) */}
                  {!isUser && (
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 text-[11px]">
                      <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        AskTheSky Official Advisory
                        {msg.detectedLocation && (
                          <span className="font-normal text-slate-400">
                            • {msg.detectedLocation}
                          </span>
                        )}
                      </span>

                      {/* Voice Audio Readout Button */}
                      <button
                        onClick={() => speakText(msg.speechText || msg.text, msg.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] transition-colors ${
                          currentlySpeakingId === msg.id
                            ? 'bg-rose-950 border-rose-700 text-rose-300'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                        title="Play / Stop Voice Audio Readout"
                      >
                        {currentlySpeakingId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-rose-400" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                            <span>Voice Readout</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Weather Snippet Box if available */}
                  {!isUser && msg.weatherSnippet && (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        <strong>{msg.weatherSnippet.location}</strong>: {msg.weatherSnippet.temp}°C ({msg.weatherSnippet.condition})
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
                        <span>🌧️ {msg.weatherSnippet.rain}mm</span>
                        <span>💨 {msg.weatherSnippet.wind}km/h</span>
                      </div>
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-line text-xs">
                    {msg.text}
                  </div>

                  {/* RAG Citations */}
                  {!isUser && msg.ragCitations && msg.ragCitations.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                      <span className="font-semibold text-cyan-400/90 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {t.aiChat.ragSources}
                      </span>
                      {msg.ragCitations.map((cit, idx) => (
                        <div key={idx} className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          {cit}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-900/60 border border-blue-700/60 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-blue-300" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-cyan-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Retrieving weather radar & official RAG guidelines...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Voice Listening Wave Indicator */}
      {isListening && (
        <div className="bg-red-950/60 border border-red-800/60 rounded-2xl p-2.5 mb-2 flex items-center justify-between text-xs text-red-300 animate-pulse">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-red-400 animate-bounce" />
            <span>{t.aiChat.listening}</span>
          </div>
          <button
            onClick={toggleListening}
            className="text-[10px] bg-red-900 px-2 py-0.5 rounded font-bold uppercase"
          >
            {t.aiChat.stopSpeakBtn}
          </button>
        </div>
      )}

      {/* Input Form with Voice & Text */}
      <form onSubmit={handleFormSubmit} className="pt-2 border-t border-slate-800 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id="chat-query-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.aiChat.inputPlaceholder}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Microphone Voice Button */}
        <button
          id="mic-voice-btn"
          type="button"
          onClick={toggleListening}
          className={`p-3 rounded-2xl border transition-all ${
            isListening
              ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-950'
              : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700'
          }`}
          title={isListening ? t.aiChat.stopSpeakBtn : t.aiChat.speakBtn}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Submit Send Button */}
        <button
          id="chat-send-btn"
          type="submit"
          disabled={!inputText.trim() || loading}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white p-3 rounded-2xl transition-all shadow-md shadow-cyan-950/50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
