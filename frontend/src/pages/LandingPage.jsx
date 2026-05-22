import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Leaf, Microscope, MessageSquare, Cloud, BookOpen, TrendingUp, Heart, ArrowRight, Play, Star, Users, Zap, Shield, Globe } from 'lucide-react';

const FEATURES = [
  { icon: Microscope, title: 'AI Disease Detection', desc: 'Upload a crop photo and get instant disease diagnosis with treatment plans.', path: '/disease', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  { icon: MessageSquare, title: 'Multilingual AI Chat', desc: 'Ask farming questions in English, Hindi or Kannada. Voice enabled.', path: '/chat', color: '#4ade80', bg: 'rgba(74,222,128,0.08)' },
  { icon: Cloud, title: 'Weather & Risk Alerts', desc: 'AI-powered weather advisories and crop risk alerts for your location.', path: '/weather', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  { icon: BookOpen, title: 'Govt Scheme Finder', desc: 'Find PM-KISAN, PMFBY, KCC schemes you are eligible for instantly.', path: '/schemes', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  { icon: TrendingUp, title: 'Market Intelligence', desc: 'Real-time crop prices, trend predictions, and best market recommendations.', path: '/market', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  { icon: Heart, title: 'Farmer Wellness', desc: 'Empathetic AI support for stress, financial challenges, and mental health.', path: '/wellness', color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
];

const STATS = [
  { value: 140, suffix: 'M+', label: 'Farmers in India', icon: Users },
  { value: 87, suffix: '%', label: 'Disease Detection Accuracy', icon: Zap },
  { value: 5, suffix: ' Schemes', label: 'Govt Schemes Integrated', icon: Shield },
  { value: 18, suffix: ' States', label: 'Active Across India', icon: Globe },
];

const TESTIMONIALS = [
  { name: 'Ramesh Patil', role: 'Tomato Farmer, Maharashtra', text: 'KrishiRakshak detected late blight in my tomato crop instantly. I saved 70% of my harvest by acting fast. This app is a blessing.', rating: 5 },
  { name: 'Kavitha Reddy', role: 'Rice Farmer, Telangana', text: 'I found out I was eligible for PM-KISAN and got ₹6,000. The AI explained the scheme in Telugu clearly. Truly helpful!', rating: 5 },
  { name: 'Gurpreet Singh', role: 'Wheat Farmer, Punjab', text: 'The weather alerts saved me from spraying pesticides before a heavy rain. The AI advisor thinks like an expert agronomist.', rating: 5 },
];

function AnimatedCounter({ target, suffix, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: 'var(--bg-primary)', overflow: 'hidden' }}>

      {/* ── HERO ── */}
      <section className="hero-section gradient-hero" style={{ paddingTop: '80px' }}>
        {/* Orbs */}
        <div className="orb orb-green" style={{ width: 500, height: 500, top: -100, left: -100 }} />
        <div className="orb orb-amber" style={{ width: 300, height: 300, bottom: 0, right: 100 }} />
        <div className="orb orb-teal" style={{ width: 200, height: 200, top: '40%', right: '30%' }} />

        <div className="content-wrapper" style={{ position: 'relative', zIndex: 2, paddingTop: '4rem', paddingBottom: '6rem' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 999, padding: '0.4rem 1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse-green 2s infinite' }} />
              <span style={{ color: '#4ade80', fontSize: '0.82rem', fontWeight: 600 }}>🌾 AI-Powered Rural Intelligence Platform</span>
            </div>

            <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 'clamp(2.8rem, 7vw, 5rem)', lineHeight: 1.1, marginBottom: '1.5rem', color: '#f0fdf4' }}>
              Empowering Farmers with{' '}
              <span className="gradient-text">AI-Driven</span>
              <br />Intelligence
            </h1>

            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#86efac', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 620, margin: '0 auto 2.5rem' }}>
              KrishiRakshak AI — Your personal agronomist, scheme advisor, and market guide. Available 24/7, in your language, for free.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} className="btn-primary" style={{ fontSize: '1.05rem', padding: '0.9rem 2rem' }}>
                  Open Dashboard <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link to="/disease" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.04, y: -3 }} className="btn-outline" style={{ fontSize: '1.05rem', padding: '0.9rem 2rem' }}>
                  <Play size={16} /> Try Disease AI
                </motion.button>
              </Link>
            </div>

            {/* Mini trust bar */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem', flexWrap: 'wrap' }}>
              {['PM-KISAN Integrated', 'PMFBY Scheme Ready', 'Kisan Helpline: 1551'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4b7a58', fontSize: '0.8rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                  {t}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Cards Preview */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
            style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: 750, margin: '4rem auto 0' }}>
            {[
              { icon: '🌿', label: 'Crop Health', value: '92/100', badge: 'Excellent' },
              { icon: '🌤️', label: 'Weather Risk', value: 'Low', badge: 'Safe to Spray' },
              { icon: '📈', label: 'Tomato Price', value: '₹2,800', badge: '+8.3% ↑' },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
                className="glass" style={{ borderRadius: 16, padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{card.icon}</div>
                <div style={{ color: '#4b7a58', fontSize: '0.72rem', marginBottom: '0.25rem' }}>{card.label}</div>
                <div style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '1.1rem' }}>{card.value}</div>
                <div style={{ color: '#4ade80', fontSize: '0.7rem', marginTop: '0.25rem' }}>{card.badge}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '5rem 0', background: 'rgba(34,197,94,0.03)', borderTop: '1px solid rgba(34,197,94,0.08)', borderBottom: '1px solid rgba(34,197,94,0.08)' }}>
        <div className="content-wrapper">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
            {STATS.map(({ value, suffix, label, icon: Icon }, i) => (
              <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Icon size={28} color="#22c55e" style={{ marginBottom: '0.75rem' }} />
                <div style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }} className="gradient-text">
                  <AnimatedCounter target={value} suffix={suffix} />
                </div>
                <div style={{ color: '#4b7a58', fontSize: '0.8rem', marginTop: '0.5rem' }}>{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '6rem 0' }}>
        <div className="content-wrapper">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-label" style={{ justifyContent: 'center', marginBottom: '1rem' }}>Platform Features</div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#f0fdf4' }}>
              Everything a Farmer Needs,<br /><span className="gradient-text">Powered by AI</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map(({ icon: Icon, title, desc, path, color, bg }, i) => (
              <motion.div key={i} className="feature-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link to={path} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <Icon size={24} color={color} />
                  </div>
                  <h3 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.6rem' }}>{title}</h3>
                  <p style={{ color: '#4b7a58', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>{desc}</p>
                  <div style={{ color, fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Explore <ArrowRight size={14} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '5rem 0', background: 'rgba(5,15,6,0.5)' }}>
        <div className="content-wrapper" style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div style={{ textAlign: 'center', marginBottom: '2.5rem' }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="section-label" style={{ justifyContent: 'center', marginBottom: '1rem' }}>Farmer Stories</div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#f0fdf4' }}>Real Impact, Real Farmers</h2>
          </motion.div>

          <div style={{ position: 'relative', minHeight: 200 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} animate={{ opacity: activeTestimonial === i ? 1 : 0, y: activeTestimonial === i ? 0 : 20 }}
                transition={{ duration: 0.5 }} style={{ position: activeTestimonial === i ? 'relative' : 'absolute', top: 0, left: 0, right: 0, display: activeTestimonial === i ? 'block' : 'none' }}>
                <div className="glass" style={{ borderRadius: 20, padding: '2rem 2.5rem', textAlign: 'center' }}>
                  <div style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '1rem' }}>{'★'.repeat(t.rating)}</div>
                  <p style={{ color: '#86efac', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '1.5rem', fontStyle: 'italic' }}>"{t.text}"</p>
                  <div style={{ color: '#f0fdf4', fontWeight: 700 }}>{t.name}</div>
                  <div style={{ color: '#4b7a58', fontSize: '0.82rem', marginTop: '0.25rem' }}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)} style={{
                width: i === activeTestimonial ? 24 : 8, height: 8, borderRadius: 999,
                background: i === activeTestimonial ? '#22c55e' : '#4b7a58', border: 'none', cursor: 'pointer', transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPACT SECTION ── */}
      <section style={{ padding: '6rem 0' }}>
        <div className="content-wrapper">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="section-label" style={{ marginBottom: '1rem' }}>Business Impact</div>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2.2rem', color: '#f0fdf4', marginBottom: '1.25rem' }}>
                Built for <span className="gradient-text">Scale & Impact</span>
              </h2>
              <p style={{ color: '#4b7a58', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                KrishiRakshak is designed as a national-scale platform with government integration, NGO partnerships, and a rural intelligence network covering 140M+ farmers.
              </p>
              {['Government Integration (NIC, NABARD)', 'NGO & FPO Partnership Ready', 'Multi-State Agri Intelligence', 'WhatsApp & IVR Expansion Ready'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifycontent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#22c55e', fontSize: '0.65rem' }}>✓</span>
                  </div>
                  <span style={{ color: '#86efac', fontSize: '0.9rem' }}>{item}</span>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Farmers Supported', value: '2.4M+', color: '#22c55e' },
                  { label: 'Diseases Detected', value: '8.7L+', color: '#4ade80' },
                  { label: 'Schemes Matched', value: '95K+', color: '#fbbf24' },
                  { label: 'States Active', value: '18', color: '#60a5fa' },
                ].map(({ label, value, color }, i) => (
                  <div key={i} className="glass glass-hover" style={{ borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 900, color, marginBottom: '0.4rem' }}>{value}</div>
                    <div style={{ color: '#4b7a58', fontSize: '0.8rem' }}>{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '5rem 0' }}>
        <div className="content-wrapper" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.15), rgba(5,46,22,0.4))', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 28, padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#f0fdf4', marginBottom: '1rem' }}>
              Start Farming Smarter Today
            </h2>
            <p style={{ color: '#86efac', marginBottom: '2rem', fontSize: '1.05rem' }}>
              Join millions of farmers using AI to increase yield, reduce losses, and access government support.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.04 }} className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
                  Get Started Free <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link to="/chat" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.04 }} className="btn-outline" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
                  <MessageSquare size={16} /> Talk to AI
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
