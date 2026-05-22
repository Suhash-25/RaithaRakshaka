import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Phone, Send, Loader } from 'lucide-react';
import { getWellness } from '../services/api';
import { useApp } from '../context/AppContext';

const QUICK_CONCERNS = [
  { emoji: '😰', label: 'Crop Loss Stress', text: 'My crop failed this season due to heavy rains. I am very stressed about finances.' },
  { emoji: '💸', label: 'Debt & Loans', text: 'I have taken loans for farming and unable to repay due to poor harvest.' },
  { emoji: '🌧️', label: 'Weather Damage', text: 'My crops were destroyed by unseasonal rain. How can I get compensation?' },
  { emoji: '😔', label: 'Feeling Hopeless', text: 'I feel like giving up farming. The losses are too much to bear.' },
  { emoji: '🏥', label: 'Health & Insurance', text: 'I need help understanding health and crop insurance options for farmers.' },
  { emoji: '🤝', label: 'Need Guidance', text: 'I need someone to guide me on what to do next after total crop failure.' },
];

const HELPLINES = [
  { name: 'PM-KISAN Helpline', number: '155261', desc: '24/7 · Financial support queries', color: '#22c55e' },
  { name: 'Farmer Distress Helpline', number: '1800-180-1551', desc: '24/7 · Free · Emotional support', color: '#60a5fa' },
  { name: 'Kisan Call Centre', number: '1551', desc: '6AM-10PM · Agricultural guidance', color: '#fbbf24' },
  { name: 'iCall Mental Health', number: '9152987821', desc: 'Mon-Sat 8AM-10PM · Counseling', color: '#a78bfa' },
];

export default function WellnessPage() {
  const { showToast, language } = useApp();
  const [concern, setConcern] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (text) => {
    const msg = text || concern.trim();
    if (!msg) return;
    setConcern(msg);
    setLoading(true);
    setResult(null);
    try {
      const d = await getWellness(msg, language);
      setResult(d);
    } catch {
      setResult({
        response: "You are not alone. Every farmer faces difficult times, but help is always available. Please reach out to our 24/7 Farmer Helpline at 1800-180-1551. You matter, and your farm can recover with the right support.",
        helplines: HELPLINES.slice(0, 2),
        resources: []
      });
    } finally { setLoading(false); }
  };

  return (
    <div className="page-container">
      <div className="content-wrapper" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-label" style={{ marginBottom: '0.4rem' }}>Mental Wellness</div>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#f0fdf4', marginBottom: '0.5rem' }}>
            Farmer Wellness Support
          </h1>
          <p style={{ color: '#4b7a58', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 600 }}>
            You are not alone. Farming is one of the toughest professions in the world. 
            Share what's on your mind — our AI is here to listen and guide you to the right resources.
          </p>
        </div>

        {/* Empathy Banner */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.1),rgba(239,68,68,0.07))', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 18, padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '2rem', flexShrink: 0 }}>🤝</span>
          <div>
            <h3 style={{ color: '#f0fdf4', fontWeight: 700, marginBottom: '0.4rem', fontSize: '1rem' }}>We Are Here For You</h3>
            <p style={{ color: '#86efac', fontSize: '0.88rem', lineHeight: 1.6 }}>
              "Every seed that falls has the potential to grow. Even after the hardest season, a new harvest awaits. 
              Your courage in farming feeds the nation — you deserve the same care in return."
            </p>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem' }}>
          {/* Input Section */}
          <div>
            <motion.div className="glass" style={{ borderRadius: 20, padding: '1.5rem', marginBottom: '1.25rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>Share Your Concern</h3>
              <p style={{ color: '#4b7a58', fontSize: '0.82rem', marginBottom: '1rem' }}>Type in English, Hindi, or Kannada</p>

              <textarea value={concern} onChange={e => setConcern(e.target.value)}
                placeholder="Describe what you're going through... Our AI will listen and guide you with practical steps and resources."
                rows={5} className="input-field" style={{ resize: 'vertical', marginBottom: '1rem', lineHeight: 1.6 }} />

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => submit()} disabled={loading || !concern.trim()}
                className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: (!concern.trim() || loading) ? 0.6 : 1 }}>
                {loading ? <><Loader size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> Getting support...</> : <><Heart size={16} /> Get Support</>}
              </motion.button>
            </motion.div>

            {/* Quick Concerns */}
            <div className="glass" style={{ borderRadius: 18, padding: '1.25rem' }}>
              <h4 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.75rem' }}>Common Concerns</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {QUICK_CONCERNS.map((q, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                    onClick={() => submit(q.text)}
                    style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.65rem', cursor: 'pointer', fontFamily: 'Inter' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{q.emoji}</div>
                    <div style={{ color: '#86efac', fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.3 }}>{q.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Response + Helplines */}
          <div>
            <AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass" style={{ borderRadius: 18, padding: '2rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <Heart size={40} color="#f87171" style={{ margin: '0 auto 1rem' }} />
                  </motion.div>
                  <p style={{ color: '#86efac', fontSize: '0.9rem' }}>Our AI is reading your concern with care...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {result && !loading && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ background: 'linear-gradient(135deg,rgba(167,139,250,0.1),rgba(239,68,68,0.06))', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 18, padding: '1.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <Heart size={18} color="#f87171" />
                    <span style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.9rem' }}>Our Response</span>
                  </div>
                  <p style={{ color: '#86efac', fontSize: '0.9rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result.response}</p>
                </div>

                {result.resources?.length > 0 && (
                  <div className="glass" style={{ borderRadius: 16, padding: '1.25rem', marginBottom: '1.25rem' }}>
                    <h4 style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem' }}>📚 Helpful Resources</h4>
                    {result.resources.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                        <span style={{ color: '#86efac', fontSize: '0.82rem' }}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Helplines - always visible */}
            <motion.div className="glass" style={{ borderRadius: 18, padding: '1.25rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Phone size={16} color="#22c55e" />
                <h4 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.88rem' }}>Emergency Helplines</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {HELPLINES.map((h, i) => (
                  <motion.a key={i} href={`tel:${h.number}`} style={{ textDecoration: 'none' }}
                    whileHover={{ x: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: `${h.color}10`, border: `1px solid ${h.color}25`, borderRadius: 12, cursor: 'pointer' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${h.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Phone size={16} color={h.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#f0fdf4', fontWeight: 600, fontSize: '0.85rem' }}>{h.name}</div>
                        <div style={{ color: '#4b7a58', fontSize: '0.72rem' }}>{h.desc}</div>
                      </div>
                      <div style={{ color: h.color, fontWeight: 700, fontSize: '1rem' }}>{h.number}</div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
