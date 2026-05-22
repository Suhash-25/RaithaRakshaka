import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Droplets, Wind, Sun, AlertTriangle, RefreshCw, MapPin } from 'lucide-react';
import { getWeather } from '../services/api';
import { useApp } from '../context/AppContext';

const COND_ICON = { Sunny: '☀️', 'Partly Cloudy': '⛅', Overcast: '☁️', 'Light Rain': '🌧️', Rain: '🌧️', Thunderstorm: '⛈️', Clear: '🌙' };

export default function WeatherPage() {
  const { location, setLocation, showToast } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(location);

  const load = async (loc) => {
    setLoading(true);
    try {
      const d = await getWeather(loc);
      setData(d);
    } catch {
      showToast('Weather data unavailable', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(location); }, []);

  const search = () => { setLocation(city); load(city); };

  const alertColor = { warning: '#fbbf24', info: '#60a5fa', danger: '#f87171', success: '#4ade80' };
  const alertBg = { warning: 'rgba(245,158,11,0.08)', info: 'rgba(96,165,250,0.08)', danger: 'rgba(239,68,68,0.08)', success: 'rgba(34,197,94,0.08)' };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '0.4rem' }}>Live Weather</div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#f0fdf4' }}>Weather & Risk Alerts</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.5rem 0.75rem' }}>
              <MapPin size={14} color="#4ade80" />
              <input value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="Enter city..." style={{ background: 'none', border: 'none', outline: 'none', color: '#f0fdf4', width: 130, fontSize: '0.88rem', fontFamily: 'Inter' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} onClick={search} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Search
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => load(location)}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={15} color="#4b7a58" />
            </motion.button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
          </div>
        ) : data && (
          <>
            {/* Current Weather */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <motion.div className="weather-widget" style={{ borderRadius: 20, padding: '2rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <MapPin size={14} color="#4ade80" />
                      <span style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 600 }}>{data.location}</span>
                    </div>
                    <div style={{ fontFamily: 'Outfit', fontSize: '4rem', fontWeight: 900, color: '#f0fdf4', lineHeight: 1 }}>
                      {data.current.temp}°
                    </div>
                    <div style={{ color: '#86efac', fontSize: '1rem', marginTop: '0.25rem' }}>{data.current.condition}</div>
                    <div style={{ color: '#4b7a58', fontSize: '0.82rem', marginTop: '0.25rem' }}>Feels like {data.current.feels_like}°C</div>
                  </div>
                  <div style={{ fontSize: '4rem', lineHeight: 1 }}>{COND_ICON[data.current.condition] || '🌤️'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' }}>
                  {[
                    { icon: Droplets, label: 'Humidity', val: `${data.current.humidity}%`, color: '#60a5fa' },
                    { icon: Wind, label: 'Wind', val: `${data.current.wind_speed} km/h`, color: '#a78bfa' },
                    { icon: Sun, label: 'UV Index', val: data.current.uv_index, color: '#fbbf24' },
                    { icon: Cloud, label: 'Rainfall', val: `${data.current.rainfall_mm} mm`, color: '#4ade80' },
                  ].map(({ icon: Icon, label, val, color }, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon size={16} color={color} />
                      <div>
                        <div style={{ color: '#4b7a58', fontSize: '0.65rem' }}>{label}</div>
                        <div style={{ color: '#f0fdf4', fontWeight: 600, fontSize: '0.9rem' }}>{val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* 5-Day Forecast */}
              <motion.div className="glass" style={{ borderRadius: 20, padding: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h3 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>5-Day Forecast</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {data.forecast.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                      <span style={{ color: '#86efac', fontSize: '0.85rem', width: 80 }}>{f.day}</span>
                      <span style={{ fontSize: '1.2rem' }}>{COND_ICON[f.condition] || '🌤️'}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#f0fdf4', fontSize: '0.85rem', fontWeight: 600 }}>{f.max}° / {f.min}°</div>
                        <div style={{ color: '#60a5fa', fontSize: '0.7rem' }}>💧 {f.rain_prob}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Alerts */}
            <motion.div className="glass" style={{ borderRadius: 20, padding: '1.5rem', marginBottom: '1.5rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertTriangle size={18} color="#fbbf24" />
                <h3 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.9rem' }}>Farming Alerts</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '0.75rem' }}>
                {data.alerts.map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                    style={{ background: alertBg[a.type] || alertBg.info, border: `1px solid ${alertColor[a.type] || '#60a5fa'}30`, borderRadius: 14, padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                      <div>
                        <div style={{ color: alertColor[a.type] || '#60a5fa', fontWeight: 700, fontSize: '0.85rem' }}>{a.title}</div>
                        <div style={{ color: '#86efac', fontSize: '0.82rem', lineHeight: 1.5, marginTop: '0.25rem' }}>{a.message}</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '0.4rem 0.6rem' }}>
                      <span style={{ color: '#4b7a58', fontSize: '0.75rem' }}>Action: </span>
                      <span style={{ color: '#f0fdf4', fontSize: '0.75rem' }}>{a.action}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* AI Advisory */}
            <motion.div style={{ background: 'linear-gradient(135deg,rgba(22,163,74,0.12),rgba(5,46,22,0.3))', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 18, padding: '1.5rem' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🤖</span>
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.88rem' }}>AI Weather Advisory</span>
              </div>
              <p style={{ color: '#86efac', lineHeight: 1.7, fontSize: '0.9rem' }}>{data.advisory}</p>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
