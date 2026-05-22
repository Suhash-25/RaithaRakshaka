import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, Leaf, RefreshCw } from 'lucide-react';
import { sendChat } from '../services/api';
import { useApp } from '../context/AppContext';

const SUGGESTIONS = [
  'My tomato leaves are turning yellow 🍅',
  'Which crops suit Karnataka this season? 🌾',
  'How do I apply for PM-KISAN? 💰',
  'Tips for drip irrigation setup 💧',
  'Pest control without chemicals 🌿',
];

const WELCOME = {
  role: 'ai',
  text: "🌾 Namaste! I'm KrishiRakshak AI — your personal farming assistant.\n\nI can help you with crop diseases, government schemes, weather advice, market prices, and much more.\n\nAsk me anything in **English, Hindi, or Kannada**! 🇮🇳",
  time: new Date(),
};

function useSpeechRecognition(onResult) {
  const recRef = useRef(null);
  const [recording, setRecording] = useState(false);

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    const r = new SR();
    r.lang = 'en-IN'; r.interimResults = false;
    r.onresult = e => onResult(e.results[0][0].transcript);
    r.onend = () => setRecording(false);
    r.start(); recRef.current = r; setRecording(true);
    return true;
  };

  const stop = () => { recRef.current?.stop(); setRecording(false); };
  return { recording, start, stop };
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
      <div className={isAI ? 'chat-bubble-ai' : 'chat-bubble-user'}
        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {msg.text}
      </div>
      <span style={{ color: '#4b7a58', fontSize: '0.65rem', marginTop: '0.25rem' }}>
        {msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </motion.div>
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
  const { showToast, language } = useApp();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const { recording, start, stop } = useSpeechRecognition((text) => {
    setInput(text);
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg, time: new Date() }]);
    setLoading(true);
    try {
      const data = await sendChat(msg, language);
      setMessages(prev => [...prev, { role: 'ai', text: data.response, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting. Please try again or call Kisan Helpline: 1551', time: new Date() }]);
    } finally { setLoading(false); }
  };

  const handleVoice = () => {
    if (recording) { stop(); return; }
    const ok = start();
    if (!ok) showToast('Voice input not supported in this browser', 'warning');
  };

  const clear = () => { setMessages([WELCOME]); };

  return (
    <div className="page-container">
      <div className="content-wrapper" style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', paddingBottom: '1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '0.3rem' }}>Multilingual AI</div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.8rem', color: '#f0fdf4' }}>AI Farm Assistant</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 999, padding: '0.3rem 0.8rem' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse-green 2s infinite' }} />
              <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>Live</span>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={clear} title="Clear chat"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={15} color="#4b7a58" />
            </motion.button>
          </div>
        </div>

        {/* Suggestions */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          {SUGGESTIONS.map((s, i) => (
            <motion.button key={i} whileHover={{ scale: 1.03 }} onClick={() => send(s)}
              style={{ whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.4rem 0.9rem', color: '#86efac', fontSize: '0.78rem', cursor: 'pointer', flexShrink: 0, fontFamily: 'Inter' }}>
              {s}
            </motion.button>
          ))}
        </div>

        {/* Messages */}
        <div className="glass" style={{ flex: 1, borderRadius: 20, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {messages.map((m, i) => <Bubble key={i} msg={m} />)}
          {loading && <TypingIndicator />}
          <div ref={endRef} />
        </div>

        {/* Input Bar */}
        <div className="glass" style={{ borderRadius: 16, padding: '0.75rem', marginTop: '0.75rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about crops, schemes, weather, market prices..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#f0fdf4', fontSize: '0.9rem', fontFamily: 'Inter', resize: 'none',
              lineHeight: 1.5, padding: '0.25rem 0',
            }}
          />
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleVoice}
            className={recording ? 'voice-ring recording' : 'voice-ring'}
            style={{ width: 40, height: 40, flexShrink: 0 }}>
            {recording ? <MicOff size={18} color="white" /> : <Mic size={18} color="white" />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => send()} disabled={loading || !input.trim()}
            className="btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', flexShrink: 0, opacity: (!input.trim() || loading) ? 0.5 : 1 }}>
            <Send size={15} /> Send
          </motion.button>
        </div>

        <p style={{ textAlign: 'center', color: '#4b7a58', fontSize: '0.72rem', marginTop: '0.5rem' }}>
          Supports English · हिंदी · ಕನ್ನಡ · Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
