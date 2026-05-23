import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, Leaf, RefreshCw, Volume2, Activity, Languages } from 'lucide-react';
import { sendChat, sendVoiceChat } from '../services/api';
import { useApp } from '../context/AppContext';

const SUGGESTIONS = [
  'My tomato leaves are turning yellow',
  'ನನ್ನ ರಾಗಿ ಬೆಳೆ ಹಳದಿ ಆಗುತ್ತಿದೆ',
  'मेरे टमाटर के पौधों में फंगस है',
  'Which crops suit Karnataka this season?',
  'How do I apply for PM-KISAN?',
];

const LANGUAGE_META = {
  en: { label: 'English', speech: 'en-IN' },
  hi: { label: 'हिन्दी', speech: 'hi-IN' },
  kn: { label: 'ಕನ್ನಡ', speech: 'kn-IN' },
};

const WELCOME = {
  role: 'ai',
  text: "Namaste! I'm KrishiRakshak AI, your multilingual farming assistant. Speak or type in English, Hindi, or Kannada, and I will reply in the same language.",
  time: new Date(),
};

function detectTextLanguage(text, fallback = 'en') {
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  const lowered = text.toLowerCase();
  const hiWords = ['kisan', 'fasal', 'kheti', 'mitti', 'paani', 'beej', 'khad', 'mandi', 'tamatar', 'aloo'];
  const knWords = ['ragi', 'bele', 'mannu', 'neeru', 'jola', 'akki', 'raitha', 'krushi', 'adike'];
  const hiScore = hiWords.filter(w => new RegExp(`\\b${w}\\b`).test(lowered)).length;
  const knScore = knWords.filter(w => new RegExp(`\\b${w}\\b`).test(lowered)).length;
  if (knScore > hiScore && knScore) return 'kn';
  if (hiScore > knScore && hiScore) return 'hi';
  return fallback || 'en';
}

function speak(text, language, onEnd) {
  const synth = window.speechSynthesis;
  if (!synth || !text) {
    onEnd?.();
    return false;
  }
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANGUAGE_META[language]?.speech || 'en-IN';
  utterance.rate = language === 'en' ? 0.95 : 0.88;
  utterance.pitch = 1;
  const voices = synth.getVoices?.() || [];
  const langPrefix = utterance.lang.split('-')[0];
  utterance.voice = voices.find(v => v.lang === utterance.lang) || voices.find(v => v.lang?.startsWith(langPrefix)) || null;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  synth.speak(utterance);
  return true;
}

function useBrowserSpeech(onResult, language) {
  const recRef = useRef(null);
  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    const r = new SR();
    r.lang = LANGUAGE_META[language]?.speech || 'en-IN';
    r.interimResults = false;
    r.continuous = false;
    r.onresult = e => onResult(e.results[0][0].transcript);
    r.start();
    recRef.current = r;
    return true;
  };
  const stop = () => recRef.current?.stop();
  return { start, stop };
}

function Bubble({ msg }) {
  const isAI = msg.role === 'ai';
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: isAI ? 'flex-start' : 'flex-end', marginBottom: '1rem' }}>
      {isAI && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#166534,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={12} color="white" />
          </div>
          <span style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 600 }}>KrishiRakshak AI</span>
        </div>
      )}
      <div className={isAI ? 'chat-bubble-ai' : 'chat-bubble-user'} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {msg.text}
      </div>
      <span style={{ color: '#4b7a58', fontSize: '0.65rem', marginTop: '0.25rem' }}>
        {msg.language ? LANGUAGE_META[msg.language]?.label : ''} {msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </motion.div>
  );
}

function VoiceStatus({ state, language }) {
  const labels = {
    idle: 'Voice ready',
    listening: 'Listening...',
    processing: 'Processing...',
    speaking: 'Speaking...',
  };
  return (
    <div data-no-translate className={`voice-status ${state}`}>
      <Activity size={14} />
      <span>{labels[state] || labels.idle}</span>
      <strong>{LANGUAGE_META[language]?.label}</strong>
      <div className="voice-wave">
        {[0, 1, 2, 3].map(i => <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />)}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#166534,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Leaf size={12} color="white" />
      </div>
      <div className="chat-bubble-ai" style={{ padding: '0.6rem 1rem' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {[0, 0.15, 0.3].map((d, i) => (
            <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }}
              animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: d }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { showToast, language, setLanguage, location } = useApp();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceState, setVoiceState] = useState('idle');
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const endRef = useRef(null);

  const browserSpeech = useBrowserSpeech((text) => {
    setVoiceState('processing');
    send(text, { fromVoice: true });
  }, language);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const finishWithSpeech = (response, lang) => {
    setVoiceState('speaking');
    const ok = speak(response, lang, () => setVoiceState('idle'));
    if (!ok) setVoiceState('idle');
  };

  const send = async (text, options = {}) => {
    const msg = text || input.trim();
    if (!msg) return;
    const detected = detectTextLanguage(msg, language);
    if (detected !== language) setLanguage(detected);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg, time: new Date(), language: detected }]);
    setLoading(true);
    try {
      const data = await sendChat(msg, detected, { location, state: 'Karnataka', preferred_language: detected });
      const replyLang = data.detected_language || data.language || detected;
      if (replyLang !== language) setLanguage(replyLang);
      setMessages(prev => [...prev, { role: 'ai', text: data.response, time: new Date(), language: replyLang }]);
      if (options.fromVoice) finishWithSpeech(data.response, replyLang);
    } catch {
      const fallback = detected === 'hi'
        ? 'माफ कीजिए, अभी कनेक्शन में समस्या है। कृपया फिर से कोशिश करें।'
        : detected === 'kn'
          ? 'ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕದಲ್ಲಿ ಸಮಸ್ಯೆ ಇದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.'
          : 'Sorry, I am having trouble connecting. Please try again.';
      setMessages(prev => [...prev, { role: 'ai', text: fallback, time: new Date(), language: detected }]);
      if (options.fromVoice) finishWithSpeech(fallback, detected);
    } finally {
      setLoading(false);
      if (!options.fromVoice) setVoiceState('idle');
    }
  };

  const sendAudio = async (blob) => {
    setVoiceState('processing');
    setLoading(true);
    try {
      const data = await sendVoiceChat(blob, 'auto', { location, state: 'Karnataka', preferred_language: language });
      const transcript = data.transcript || '';
      const replyLang = data.detected_language || detectTextLanguage(transcript, language);
      setLanguage(replyLang);
      setMessages(prev => [
        ...prev,
        { role: 'user', text: transcript, time: new Date(), language: replyLang },
        { role: 'ai', text: data.response, time: new Date(), language: replyLang },
      ]);
      finishWithSpeech(data.response, replyLang);
    } catch {
      showToast('Server voice transcription unavailable; using browser speech fallback', 'warning');
      const ok = browserSpeech.start();
      setVoiceState(ok ? 'listening' : 'idle');
      if (!ok) showToast('Voice input not supported in this browser', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      const ok = browserSpeech.start();
      setVoiceState(ok ? 'listening' : 'idle');
      if (!ok) showToast('Voice input not supported in this browser', 'warning');
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunksRef.current = [];
    const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : {};
    const recorder = new MediaRecorder(stream, options);
    recorder.ondataavailable = (event) => event.data?.size && chunksRef.current.push(event.data);
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      sendAudio(blob);
    };
    recorder.start();
    mediaRef.current = recorder;
    setVoiceState('listening');
  };

  const handleVoice = () => {
    if (voiceState === 'listening') {
      mediaRef.current?.stop();
      browserSpeech.stop();
      setVoiceState('processing');
      return;
    }
    if (voiceState === 'speaking') {
      window.speechSynthesis?.cancel();
      setVoiceState('idle');
      return;
    }
    startRecording().catch(() => {
      showToast('Microphone permission is required for voice AI', 'warning');
      setVoiceState('idle');
    });
  };

  const clear = () => {
    window.speechSynthesis?.cancel();
    setVoiceState('idle');
    setMessages([WELCOME]);
  };

  return (
    <div className="page-container">
      <div className="content-wrapper" style={{ maxWidth: 820, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '0.3rem' }}>Multilingual Voice AI</div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.8rem', color: '#f0fdf4' }}>AI Farm Assistant</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <VoiceStatus state={voiceState} language={language} />
            <div data-no-translate style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 999, padding: '0.3rem 0.8rem' }}>
              <Languages size={13} color="#4ade80" />
              <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>{LANGUAGE_META[language]?.label}</span>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={clear} title="Clear chat"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={15} color="#4b7a58" />
            </motion.button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          {SUGGESTIONS.map((s, i) => (
            <motion.button key={i} whileHover={{ scale: 1.03 }} onClick={() => send(s)}
              style={{ whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.4rem 0.9rem', color: '#86efac', fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0, fontFamily: 'Inter' }}>
              {s}
            </motion.button>
          ))}
        </div>

        <div className="glass" style={{ flex: 1, borderRadius: 20, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {loading && <TypingIndicator />}
          <div ref={endRef} />
        </div>

        <div className="glass" style={{ borderRadius: 16, padding: '0.75rem', marginTop: '0.75rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask in English, Hindi, or Kannada..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f0fdf4', fontSize: '0.9rem', fontFamily: 'Inter', resize: 'none',
              lineHeight: 1.5, padding: '0.25rem 0',
            }}
          />
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleVoice}
            className={voiceState === 'listening' ? 'voice-ring recording' : voiceState === 'speaking' ? 'voice-ring speaking' : 'voice-ring'}
            style={{ width: 40, height: 40, flexShrink: 0 }}
            title={voiceState === 'listening' ? 'Stop recording' : voiceState === 'speaking' ? 'Stop speaking' : 'Start voice chat'}>
            {voiceState === 'speaking' ? <Volume2 size={18} color="white" /> : voiceState === 'listening' ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => send()} disabled={loading || !input.trim()}
            className="btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', flexShrink: 0, opacity: (!input.trim() || loading) ? 0.5 : 1 }}>
            <Send size={15} /> Send
          </motion.button>
        </div>

        <p style={{ textAlign: 'center', color: '#4b7a58', fontSize: '0.72rem', marginTop: '0.5rem' }}>
          Voice flow: Listening → Processing → Speaking. The reply language follows the language you speak or type.
        </p>
      </div>
    </div>
  );
}
