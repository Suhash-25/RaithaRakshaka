import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, ChevronRight, Cloud, Heart, LayoutDashboard, MessageSquare, Microscope, RefreshCw, TrendingUp } from 'lucide-react';
import { getDashboard } from '../services/api';

const CARD_LINKS = [
  { path: '/disease', label: 'Crop Disease AI', desc: 'Scan and identify crop leaf diseases instantly', icon: Microscope, color: '#4ade80' },
  { path: '/chat', label: 'AI Farm Advisor', desc: 'Multilingual live agriculture assistant', icon: MessageSquare, color: '#22c55e' },
  { path: '/weather', label: 'Weather Alerts', desc: 'Precipitation, wind speed, and farm advisories', icon: Cloud, color: '#60a5fa' },
  { path: '/schemes', label: 'Scheme Finder', desc: 'Government subsidies, loans, and benefit matching', icon: BookOpen, color: '#fbbf24' },
  { path: '/market', label: 'Market Insights', desc: 'Crop mandi prices, trend directions, and predictions', icon: TrendingUp, color: '#a78bfa' },
  { path: '/wellness', label: 'Wellness & Help', desc: 'Counseling and helpline resources for farmers', icon: Heart, color: '#f87171' },
];

function normalizeDashboard(d) {
  const weatherAlerts = d?.live_context?.weather?.alerts?.map((a) => ({
    type: a.type || 'info',
    message: `${a.title}: ${a.message}`,
  })) || [];
  return {
    health_score: d?.health_score ?? d?.crop_health_score ?? 0,
    location: d?.location || d?.live_context?.weather?.location || 'Live farm network',
    alert_count: d?.alert_count ?? d?.active_alerts ?? weatherAlerts.length ?? 0,
    market_trend: String(d?.market_trend || 'live').toLowerCase(),
    alerts: weatherAlerts.length ? weatherAlerts : (d?.alerts || []),
    overview: d?.overview || d?.ai_tip || 'Live dashboard connected. Refresh to pull current weather, scheme, and market intelligence.',
    updated_at: d?.stats?.updated_at,
    sources: d?.stats || {},
  };
}

function RingChart({ score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const circ = 2 * Math.PI * 36;
  const offset = circ - (safeScore / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto' }}>
      <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle cx="45" cy="45" r="36" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <motion.circle cx="45" cy="45" r="36" fill="transparent" stroke="#22c55e" strokeWidth="6"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 0.8 }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22c55e' }}>{safeScore}</span>
        <span style={{ fontSize: '0.55rem', color: '#4b7a58', fontWeight: 600 }}>INDEX</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await getDashboard();
      setData(normalizeDashboard(d));
    } catch {
      setError('Live dashboard data is temporarily unavailable. Start the FastAPI backend on port 8001 and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getAlertColor = (t) => t === 'warning' ? '#fbbf24' : t === 'danger' ? '#f87171' : '#60a5fa';
  const trendLabel = data?.market_trend === 'rising' ? 'Rising' : data?.market_trend === 'falling' ? 'Falling' : 'Live';

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '0.4rem' }}>LIVE FARM DASHBOARD</div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#f0fdf4' }}>Agri-Intelligence Overview</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="live-pill">
              <span className={loading ? 'live-dot loading' : 'live-dot'} />
              <span>{data?.location || 'Connecting live data'}</span>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={load}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.45rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={15} color="#4b7a58" />
            </motion.button>
          </div>
        </div>

        {loading && !data ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '1.5rem' }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />)}
          </div>
        ) : error && !data ? (
          <div className="glass" style={{ borderRadius: 18, padding: '1.25rem', color: '#fbbf24' }}>{error}</div>
        ) : data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ borderRadius: 20, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <RingChart score={data.health_score} />
                <div>
                  <h3 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.95rem' }}>Crop Health</h3>
                  <p style={{ color: '#4b7a58', fontSize: '0.78rem', marginTop: '0.25rem' }}>Derived from live weather risk and crop context</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass" style={{ borderRadius: 20, padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#4b7a58', fontSize: '0.75rem' }}>Active Risk Alerts</span>
                  <AlertTriangle size={18} color="#fbbf24" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>{data.alert_count}</div>
                <p style={{ color: '#86efac', fontSize: '0.75rem', marginTop: '0.25rem' }}>Live weather intelligence</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass" style={{ borderRadius: 20, padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#4b7a58', fontSize: '0.75rem' }}>Mandi Price Trend</span>
                  <TrendingUp size={18} color="#4ade80" />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#4ade80' }}>{trendLabel}</div>
                <p style={{ color: '#4b7a58', fontSize: '0.75rem', marginTop: '0.25rem' }}>Source: {data.sources.market_source || 'live market service'}</p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ gridColumn: 'span 12', background: 'linear-gradient(135deg,rgba(34,197,94,0.12),rgba(5,46,22,0.3))', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 18, padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <LayoutDashboard size={18} color="#4ade80" />
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.88rem' }}>AI Farming Advisory</span>
              </div>
              <p style={{ color: '#86efac', fontSize: '0.88rem', lineHeight: 1.6 }}>{data.overview}</p>
              <p style={{ color: '#4b7a58', fontSize: '0.72rem', marginTop: '0.75rem' }}>Updated: {data.updated_at ? new Date(data.updated_at).toLocaleString() : 'just now'}</p>
            </motion.div>

            <div className="glass md:col-span-4 col-span-12" style={{ borderRadius: 20, padding: '1.5rem' }}>
              <h3 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Notifications & Alerts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(data.alerts.length ? data.alerts : [{ type: 'info', message: 'No active live alerts returned for this profile.' }]).map((a, i) => {
                  const color = getAlertColor(a.type);
                  return (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20`, borderRadius: 12, padding: '0.75rem' }}>
                      <AlertTriangle size={15} color={color} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <p style={{ color: '#86efac', fontSize: '0.8rem', lineHeight: 1.5 }}>{a.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-8 col-span-12" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {CARD_LINKS.map(({ path, label, desc, icon: Icon, color }) => (
                <Link key={path} to={path} style={{ textDecoration: 'none' }}>
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} className="glass glass-hover" style={{ borderRadius: 16, padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <Icon size={18} color={color} />
                    </div>
                    <h4 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {label} <ChevronRight size={14} color="#4b7a58" />
                    </h4>
                    <p style={{ color: '#4b7a58', fontSize: '0.75rem', lineHeight: 1.4, marginTop: '0.25rem' }}>{desc}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
