import { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, Mic, MicOff, Volume2, VolumeX, X, Sparkles, TrendingUp,
  Map as MapIcon, Maximize2, Minimize2, ChevronRight, ShieldAlert,
  Activity, Radar, Globe2,
} from 'lucide-react';
import { ViewMode } from '../types';
import { runCopilot, normalizeSection, SECTION_NAMES, STARTER_SUGGESTIONS, KeyMetric } from '../lib/copilot';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  navigationTriggered?: ViewMode | null;
  thinking?: string;
  keyMetrics?: KeyMetric[];
  suggestions?: string[];
}

const PREFERRED_VOICES = [
  'Google US English', 'Microsoft Aria Online (Natural)', 'Microsoft Jenny Online (Natural)',
  'Microsoft Emma Online (Natural)', 'Microsoft Guy Online (Natural)', 'Samantha',
  'Google UK English Female', 'Microsoft Zira',
];
function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  for (const pref of PREFERRED_VOICES) {
    const m = voices.find((v) => v.name.toLowerCase().includes(pref.toLowerCase()));
    if (m) return m;
  }
  const natural = voices.find((v) => v.lang.startsWith('en') && /natural|online/i.test(v.name));
  if (natural) return natural;
  return voices.find((v) => v.lang === 'en-US') || voices.find((v) => v.lang.startsWith('en')) || null;
}

interface WCAROCopilotProps {
  onNavigate: (view: ViewMode) => void;
  currentView?: ViewMode;
}

export default function WCAROCopilot({ onNavigate }: WCAROCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Greetings. I'm the WCARO AI Copilot — your strategic information and geospatial intelligence companion. Ask me to summarize the region, explain an indicator, surface crisis hotspots, or open any module. You can type or speak.",
      timestamp: new Date(),
      thinking: '• WCARO intelligence core online.\n• Loaded the Population Data Portal dataset and Strategic Plan 2026–2029 modules.\n• Reasoning + navigation routing enabled.',
      suggestions: STARTER_SUGGESTIONS.slice(0, 3),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const handleSendMessageRef = useRef<any>(null);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const load = () => {
      const vs = synth.getVoices();
      if (vs.length) selectedVoiceRef.current = pickBestVoice(vs);
    };
    load();
    synth.addEventListener?.('voiceschanged', load);
    return () => synth.removeEventListener?.('voiceschanged', load);
  }, []);

  useEffect(() => () => { try { window.speechSynthesis.cancel(); } catch {} }, []);

  useEffect(() => { handleSendMessageRef.current = handleSendMessage; });

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechSupport(true);
      const rec = new SpeechRecognition();
      rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        const t = e.results[0][0].transcript;
        if (t) { setInputValue(t); handleSendMessageRef.current?.(t); }
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => speakResponse('Greetings. I am the WCARO AI Copilot. You can type or speak your request.'), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const open = () => { setIsOpen(true); setIsMinimized(false); };
    window.addEventListener('quantum:open-copilot', open);
    return () => window.removeEventListener('quantum:open-copilot', open);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading, isOpen]);

  const speakResponse = (text: string) => {
    if (isMuted) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`[\]()]/g, '');
      const u = new SpeechSynthesisUtterance(clean);
      const voice = selectedVoiceRef.current || pickBestVoice(window.speechSynthesis.getVoices());
      if (voice) { u.voice = voice; u.lang = voice.lang || 'en-US'; } else { u.lang = 'en-US'; }
      u.rate = 0.98; u.pitch = 1.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const renderMessageContent = (text: string) => {
    if (!text) return null;
    return text.split(/(\[[^\]]+\])/g).map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const label = part.slice(1, -1);
        const target = normalizeSection(label);
        if (target) {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); onNavigate(target); }}
              className="inline-flex items-center gap-1 mx-1 px-2.5 py-1 rounded-lg bg-quantum-blue-pale hover:bg-quantum-blue text-quantum-blue hover:text-white font-bold border border-quantum-blue/20 cursor-pointer transition-all text-[11px]"
              title={`Open ${SECTION_NAMES[target] || target}`}
            >
              🔗 {label}
            </button>
          );
        }
      }
      return <span key={i} className="whitespace-pre-line">{part}</span>;
    });
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition && !hasSpeechSupport) {
      setMessages((p) => [...p, { id: Math.random().toString(), sender: 'assistant', text: 'Voice recognition isn’t supported in this browser. You can type any command below.', timestamp: new Date() }]);
      return;
    }
    if (isListening) { recognitionRef.current?.stop(); }
    else {
      try { window.speechSynthesis.cancel(); recognitionRef.current?.start(); }
      catch (e) { console.warn('Speech start failed', e); }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const raw = (textToSend || inputValue).trim();
    if (!raw) return;
    if (!textToSend) setInputValue('');

    setMessages((p) => [...p, { id: Math.random().toString(), sender: 'user', text: raw, timestamp: new Date() }]);
    setIsLoading(true);

    const history = messages.slice(-8).map((m) => ({ role: (m.sender === 'assistant' ? 'model' : 'user') as 'user' | 'model', text: m.text }));

    try {
      const data = await runCopilot(raw, history);
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.text,
        timestamp: new Date(),
        navigationTriggered: data.navigation || undefined,
        thinking: data.thinking,
        keyMetrics: data.keyMetrics,
        suggestions: data.suggestions,
      };
      setMessages((p) => [...p, assistantMsg]);
      setIsLoading(false);
      speakResponse(assistantMsg.text);
      if (data.navigation) onNavigate(data.navigation);
    } catch (err) {
      console.error(err);
      setMessages((p) => [...p, { id: Math.random().toString(), sender: 'assistant', text: 'I hit a snag processing that. Try rephrasing, or pick a module to explore.', timestamp: new Date() }]);
      setIsLoading(false);
    }
  };

  const QUICK = [
    { icon: <Sparkles className="w-3 h-3 text-unfpa-orange" />, label: 'Region Summary', prompt: 'Give a strategic summary of the West & Central Africa region — population, maternal mortality, unmet need and crisis hotspots.' },
    { icon: <ShieldAlert className="w-3 h-3 text-red-500" />, label: 'Crisis Hotspots', prompt: 'Where are the crisis hotspots and what do they mean for UNFPA response readiness?' },
    { icon: <Activity className="w-3 h-3 text-rose-500" />, label: 'Maternal Mortality', prompt: 'Summarize maternal mortality across the region and where it is highest.' },
    { icon: <TrendingUp className="w-3 h-3 text-blue-500" />, label: 'Quantum Tracker', prompt: 'Open the Quantum Tracker monitoring report intelligence.' },
    { icon: <MapIcon className="w-3 h-3 text-emerald-500" />, label: 'Geospatial Stage', prompt: 'Open the Geospatial Stage interactive map.' },
    { icon: <Radar className="w-3 h-3 text-indigo-500" />, label: 'Geo Monitoring', prompt: 'Open Geospatial Monitoring and show the risk flux.' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 bg-quantum-blue text-white px-5 py-4 rounded-full shadow-2xl hover:bg-quantum-blue-dark transition-all duration-300 hover:scale-105 active:scale-95 group font-bold text-xs cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
          </div>
          <span>WCARO AI Copilot</span>
          <span className="bg-unfpa-orange text-[9px] px-1.5 py-0.5 rounded-md uppercase font-extrabold tracking-wider text-white group-hover:scale-110 transition-transform">VOICE LIVE</span>
        </button>
      )}

      {isOpen && (
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300"
          style={{ width: isMinimized ? '280px' : '420px', maxWidth: '90vw', height: isMinimized ? '56px' : '560px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-quantum-blue to-quantum-blue-dark text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center relative">
                <Bot className="w-4 h-4 text-white" />
                {isListening && <span className="absolute inset-0 rounded-xl bg-unfpa-orange/40 animate-ping" />}
              </div>
              <div>
                <h3 className="font-bold text-xs leading-none flex items-center gap-1.5">
                  WCARO AI Copilot
                  <span className="text-[9px] bg-unfpa-orange text-white px-1 py-0.5 rounded font-extrabold scale-90 uppercase">SIGA</span>
                </h3>
                <p className="text-[10px] text-white/70 mt-0.5 font-medium">Strategic Intelligence Companion</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { const n = !isMuted; setIsMuted(n); if (n) window.speechSynthesis.cancel(); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white cursor-pointer" title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white hidden sm:inline-block cursor-pointer" title={isMinimized ? 'Maximize' : 'Minimize'}>
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => { setIsOpen(false); window.speechSynthesis.cancel(); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 no-scrollbar">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs inline-block relative ${msg.sender === 'user' ? 'bg-quantum-blue text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'}`}>
                      {renderMessageContent(msg.text)}

                      {msg.sender === 'assistant' && msg.thinking && (
                        <div className="mt-2.5 text-[10px] bg-slate-50 border border-slate-200/85 rounded-xl p-2.5">
                          <details className="group/think">
                            <summary className="font-extrabold flex items-center gap-1.5 text-slate-600 hover:text-slate-800 cursor-pointer list-none select-none">
                              <Sparkles className="w-3 h-3 text-unfpa-orange animate-pulse shrink-0" />
                              <span>Copilot reasoning</span>
                              <ChevronRight className="w-3 h-3 transition-transform group-open/think:rotate-90 ml-auto text-slate-400" />
                            </summary>
                            <div className="mt-2 pt-2 border-t border-slate-200/60 text-slate-600 font-mono text-[9px] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{msg.thinking}</div>
                          </details>
                        </div>
                      )}

                      {msg.sender === 'assistant' && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); speakResponse(msg.text); }} className="absolute -right-2 top-2 bg-white text-slate-500 hover:text-quantum-blue hover:border-quantum-blue border border-slate-200 p-1 rounded-full shadow-md transition-all hover:scale-110 cursor-pointer" title="Read aloud">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {msg.sender === 'assistant' && msg.keyMetrics && msg.keyMetrics.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {msg.keyMetrics.map((km, i) => {
                            const tone = km.status === 'met' || km.status === 'on_track' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : km.status === 'missed' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200';
                            return <span key={i} className={`px-2 py-1 rounded-lg border text-[10px] font-semibold ${tone}`} title={km.label}><span className="opacity-70">{km.label}: </span>{km.value}</span>;
                          })}
                        </div>
                      )}

                      {msg.navigationTriggered && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200">
                          <button type="button" onClick={(e) => { e.stopPropagation(); onNavigate(msg.navigationTriggered!); }} className="w-full bg-quantum-blue-pale text-quantum-blue hover:bg-quantum-blue hover:text-white px-2.5 py-1.5 rounded-lg font-bold border border-quantum-blue/15 flex items-center justify-between text-[10px] transition-all cursor-pointer">
                            <span className="flex items-center gap-1.5"><span>🔗</span><span>Open {SECTION_NAMES[msg.navigationTriggered] || msg.navigationTriggered}</span></span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {msg.sender === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
                          {msg.suggestions.map((s, i) => (
                            <button key={i} type="button" onClick={(e) => { e.stopPropagation(); handleSendMessage(s); }} className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-quantum-blue hover:text-quantum-blue text-[10px] font-medium transition-colors cursor-pointer text-left">{s}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}

                {!isLoading && messages.filter((m) => m.sender === 'user').length === 0 && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Try asking</span>
                    <div className="flex flex-wrap gap-1.5">
                      {STARTER_SUGGESTIONS.map((s, i) => (
                        <button key={i} type="button" onClick={() => handleSendMessage(s)} className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-quantum-blue hover:text-quantum-blue hover:bg-quantum-blue-pale/40 text-[11px] font-medium transition-colors cursor-pointer text-left shadow-sm">{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 bg-white border border-slate-100 p-3 rounded-2xl w-2/3 shadow-sm">
                    <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-quantum-blue-light opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-quantum-blue" /></span>
                    <span className="text-xs text-slate-500 font-medium">Copilot is thinking…</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick actions */}
              <div className="bg-white border-t border-slate-100 px-4 py-2.5 shrink-0 overflow-x-auto flex gap-2 no-scrollbar whitespace-nowrap">
                {QUICK.map((q) => (
                  <button key={q.label} onClick={() => handleSendMessage(q.prompt)} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 inline-flex items-center gap-1 cursor-pointer transition-colors">
                    {q.icon} {q.label}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-200 bg-white shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                  <button type="button" onClick={toggleListening} className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${isListening ? 'bg-red-500 text-white border-red-500 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`} title={isListening ? 'Listening… click to stop' : 'Speak'}>
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isListening ? 'Listening…' : 'Ask the WCARO Copilot…'}
                    className="flex-1 min-w-0 bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-quantum-blue focus:bg-white transition-all font-medium"
                    disabled={isListening}
                  />
                  <button type="submit" disabled={!inputValue.trim() || isLoading} className="p-2.5 rounded-xl bg-quantum-blue text-white hover:bg-quantum-blue-dark active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
