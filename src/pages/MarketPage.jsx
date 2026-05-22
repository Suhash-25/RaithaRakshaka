import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import { getMarket, getAllMarkets } from '../services/api';

const CROPS = ['Tomato','Onion','Potato','Rice','Wheat','Maize','Cotton','Sugarcane','Soybean','Groundnut'];

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.price));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: 100, padding: '0 4px', marginTop: '0.5rem' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const isPred = d.label === 'Predicted';
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <motion.div style={{ width: '100%', background: isPred ? 'linear-gradient(to top,#d97706,#fbbf24)' : 'linear-gradient(to top,#166534,#4ade80)', borderRadius: '4px 4px 0 0', border: isPred ? '1px dashed #fbbf24' : 'none', opacity: isPred ? 0.7 : 1 }}
              initial={{ height: 0 }} animate={{ height: `${(d.price / max) * 85}px` }} transition={{ delay: i * 0.08, duration: 0.6 }} />
            <span style={{ fontSize: '0.58rem', color: isLast ? '#4ade80' : '#4b7a58', textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function MarketPage() {
  const [selected, setSelected] = useState('Tomato');
  const [data, setData] = useState(null);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async (crop) => {
    setLoading(true);
    try { setData(await getMarket(crop)); }
    catch { /* use cached */ }
    finally { setLoading(false); }
  };

  const loadTrending = async () => {
    try { const d = await getAllMarkets(); setTrending(d.trending || []); }
    catch {}
  };

  useEffect(() => { load(selected); loadTrending(); }, []);

  const select = (crop) => { setSelected(crop); load(crop); };

  const isUp = data?.trend === 'rising';
  const filteredCrops = CROPS.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-label" style={{ marginBottom: '0.4rem' }}>Price Intelligence</div>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#f0fdf4' }}>Market Insights</h1>
          <p style={{ color: '#4b7a58', fontSize: '0.88rem', marginTop: '0.3rem' }}>Real-time crop prices, trends, and AI-powered predictions</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Crop Selector */}
          <div className="glass" style={{ borderRadius: 18, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
              <Search size={14} color="#4b7a58" />
              <input placeholder="Search crop..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: '#f0fdf4', fontSize: '0.85rem', fontFamily: 'Inter', width: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {filteredCrops.map(c => (
                <motion.button key={c} whileHover={{ x: 4 }} onClick={() => select(c)}
                  style={{ textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.88rem', transition: 'all 0.2s',
                    background: selected === c ? 'rgba(34,197,94,0.15)' : 'transparent',
                    color: selected === c ? '#4ade80' : '#86efac',
                    borderLeft: selected === c ? '2px solid #22c55e' : '2px solid transparent' }}>
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Main Panel */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
              </div>
            ) : data && (
              <>
                {/* Price Card */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: isUp ? 'linear-gradient(135deg,rgba(22,163,74,0.15),rgba(5,46,22,0.35))' : 'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(30,0,0,0.3))', border: `1px solid ${isUp ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 20, padding: '1.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h2 style={{ color: '#f0fdf4', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>{data.crop}</h2>
                      <p style={{ color: '#4b7a58', fontSize: '0.82rem' }}>{data.unit}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Outfit', fontSize: '2.5rem', fontWeight: 900, color: '#f0fdf4', lineHeight: 1 }}>₹{data.current_price?.toLocaleString()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.25rem' }}>
                        <span style={{ color: isUp ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: '1rem' }}>
                          {data.price_change > 0 ? '+' : ''}{data.price_change}% this week
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'MSP', val: `₹${data.msp?.toLocaleString()}` },
                      { label: 'Demand', val: data.demand },
                      { label: 'Best Market', val: data.best_market },
                    ].map((m, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ color: '#4b7a58', fontSize: '0.68rem', marginBottom: '0.2' }}>{m.label}</div>
                        <div style={{ color: '#f0fdf4', fontWeight: 600, fontSize: '0.85rem' }}>{m.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <BarChart data={data.chart} />
                </motion.div>

                {/* AI Prediction */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  className="glass" style={{ borderRadius: 18, padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>🤖</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.88rem' }}>AI Price Prediction</span>
                  </div>
                  <p style={{ color: '#86efac', fontSize: '0.9rem', lineHeight: 1.6 }}>{data.ai_prediction}</p>
                </motion.div>

                {/* Top Markets */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="glass" style={{ borderRadius: 18, padding: '1.25rem' }}>
                  <h3 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Nearby Markets</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {data.top_markets?.map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                        <div>
                          <div style={{ color: '#f0fdf4', fontWeight: 600, fontSize: '0.88rem' }}>{m.name}</div>
                          <div style={{ color: '#4b7a58', fontSize: '0.75rem' }}>{m.distance_km} km away</div>
                        </div>
                        <div style={{ color: '#4ade80', fontWeight: 700 }}>₹{m.price?.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Trending */}
        {trending.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#f0fdf4', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>📊 Trending Today</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.75rem' }}>
              {trending.map((t, i) => (
                <motion.div key={i} whileHover={{ y: -4 }} onClick={() => select(t.crop)}
                  className="glass glass-hover" style={{ borderRadius: 14, padding: '1rem', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ color: '#f0fdf4', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>{t.crop}</div>
                  <div style={{ color: '#86efac', fontWeight: 700, fontSize: '1rem' }}>₹{t.price?.toLocaleString()}</div>
                  <div style={{ color: t.change >= 0 ? '#4ade80' : '#f87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {t.change >= 0 ? '↑' : '↓'} {Math.abs(t.change)}%
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
