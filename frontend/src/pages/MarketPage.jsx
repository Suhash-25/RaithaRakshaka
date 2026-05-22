import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { getAllMarkets, getMarket } from '../services/api';
import { useApp } from '../context/AppContext';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean', 'Groundnut'];

function BarChart({ data = [] }) {
  if (!data.length) return <div className="skeleton" style={{ height: 100, borderRadius: 12 }} />;
  const max = Math.max(...data.map(d => Number(d.price) || 1));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: 100, padding: '0 4px', marginTop: '0.5rem' }}>
      {data.map((d, i) => {
        const isPred = d.label === 'Predicted';
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <motion.div style={{ width: '100%', background: isPred ? 'linear-gradient(to top,#d97706,#fbbf24)' : 'linear-gradient(to top,#166534,#4ade80)', borderRadius: '4px 4px 0 0', border: isPred ? '1px dashed #fbbf24' : 'none', opacity: isPred ? 0.75 : 1 }}
              initial={{ height: 0 }} animate={{ height: `${((Number(d.price) || 1) / max) * 85}px` }} transition={{ delay: i * 0.08, duration: 0.55 }} />
            <span style={{ fontSize: '0.58rem', color: isPred ? '#fbbf24' : '#4b7a58', textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function MarketPage() {
  const { selectedLocation, setSelectedLocation } = useApp();
  const [selected, setSelected] = useState('Tomato');
  const [data, setData] = useState(null);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [marketLocation, setMarketLocation] = useState(selectedLocation?.district || 'Bangalore');
  const detailRequestRef = useRef(0);
  const trendingRequestRef = useRef(0);

  const activeRegion = {
    district: selectedLocation?.district || 'Bangalore',
    state: selectedLocation?.state || 'Karnataka',
    mandi: selectedLocation?.mandi || selectedLocation?.district || 'Bangalore',
    coordinates: selectedLocation?.coordinates || {},
  };
  const regionLabel = `${activeRegion.district}, ${activeRegion.state}`;

  const load = useCallback(async (crop, loc = activeRegion) => {
    const requestId = ++detailRequestRef.current;
    setLoading(true);
    setError('');
    try {
      const nextData = await getMarket(crop, loc);
      if (requestId === detailRequestRef.current) setData(nextData);
    } catch {
      if (requestId === detailRequestRef.current) {
        setError('Live mandi price service is unavailable. Please verify the backend and Agmarknet access.');
      }
    } finally {
      if (requestId === detailRequestRef.current) setLoading(false);
    }
  }, [activeRegion.district, activeRegion.state, activeRegion.mandi]);

  const loadTrending = useCallback(async (loc = activeRegion) => {
    const requestId = ++trendingRequestRef.current;
    try {
      const d = await getAllMarkets(loc);
      if (requestId === trendingRequestRef.current) setTrending(d.trending || []);
    } catch {
      if (requestId === trendingRequestRef.current) setTrending([]);
    }
  }, [activeRegion.district, activeRegion.state, activeRegion.mandi]);

  useEffect(() => {
    setMarketLocation(activeRegion.district);
    loadTrending(activeRegion);
  }, [activeRegion.district, activeRegion.state, activeRegion.mandi, loadTrending]);

  useEffect(() => {
    load(selected, activeRegion);
  }, [activeRegion.district, activeRegion.state, activeRegion.mandi, load, selected]);

  const select = (crop) => {
    setSelected(crop);
  };

  const applyLocation = () => {
    const district = marketLocation.trim();
    if (!district) return;
    setSelectedLocation({
      district,
      state: selectedLocation?.state || 'Karnataka',
      mandi: district,
      coordinates: selectedLocation?.coordinates || {},
    });
  };

  const isUp = data?.trend !== 'falling';
  const filteredCrops = CROPS.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '0.4rem' }}>LIVE PRICE INTELLIGENCE</div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#f0fdf4' }}>Market Insights</h1>
            <p style={{ color: '#4b7a58', fontSize: '0.88rem', marginTop: '0.3rem' }}>Agmarknet 2.0 mandi prices filtered by selected location</p>
            <div className="live-pill" style={{ marginTop: '0.75rem', width: 'fit-content' }}>
              <MapPin size={13} />
              <span>Current Market Region: {regionLabel}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.5rem 0.75rem' }}>
              <MapPin size={14} color="#4ade80" />
              <input value={marketLocation} onChange={e => setMarketLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyLocation()}
                placeholder="City / mandi..." style={{ background: 'none', border: 'none', outline: 'none', color: '#f0fdf4', width: 130, fontSize: '0.88rem', fontFamily: 'Inter' }} />
            </div>
            <motion.button whileHover={{ scale: 1.05 }} onClick={applyLocation} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Apply
            </motion.button>
            <div className="live-pill" style={{ height: 'fit-content' }}>
              <span className={loading ? 'live-dot loading' : 'live-dot'} />
              <span>{data?.source || 'Connecting market feed'}</span>
            </div>
          </div>
        </div>

        <div className="market-layout">
          <div className="glass" style={{ borderRadius: 18, padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
              <Search size={14} color="#4b7a58" />
              <input placeholder="Search crop..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: '#f0fdf4', fontSize: '0.85rem', fontFamily: 'Inter', width: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {filteredCrops.map(c => (
                <motion.button key={c} whileHover={{ x: 4 }} onClick={() => select(c)}
                  style={{ textAlign: 'left', padding: '0.6rem 0.75rem', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.88rem',
                    background: selected === c ? 'rgba(34,197,94,0.15)' : 'transparent',
                    color: selected === c ? '#4ade80' : '#86efac',
                    border: 'none',
                    borderLeft: selected === c ? '2px solid #22c55e' : '2px solid transparent' }}>
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            {loading && !data ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
              </div>
            ) : error && !data ? (
              <div className="glass" style={{ borderRadius: 18, padding: '1.25rem', color: '#fbbf24' }}>{error}</div>
            ) : data && (
              <>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: isUp ? 'linear-gradient(135deg,rgba(22,163,74,0.15),rgba(5,46,22,0.35))' : 'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(30,0,0,0.3))', border: `1px solid ${isUp ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 20, padding: '1.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <h2 style={{ color: '#f0fdf4', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>{data.crop}</h2>
                      <p style={{ color: '#4b7a58', fontSize: '0.82rem' }}>{data.unit}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Outfit', fontSize: '2.5rem', fontWeight: 900, color: '#f0fdf4', lineHeight: 1 }}>{data.current_price ? `Rs ${data.current_price.toLocaleString()}` : 'Unavailable'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.25rem' }}>
                        {isUp ? <TrendingUp size={18} color="#4ade80" /> : <TrendingDown size={18} color="#f87171" />}
                        <span style={{ color: isUp ? '#4ade80' : '#f87171', fontWeight: 700, fontSize: '1rem' }}>
                          {data.price_change > 0 ? '+' : ''}{data.price_change}% this week
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'MSP Estimate', val: `Rs ${data.msp?.toLocaleString()}` },
                      { label: 'Demand', val: data.demand },
                      { label: 'Best Market', val: data.best_market },
                      { label: 'Region', val: data.location || regionLabel },
                    ].map((m, i) => (
                      <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ color: '#4b7a58', fontSize: '0.68rem', marginBottom: '0.2rem' }}>{m.label}</div>
                        <div style={{ color: '#f0fdf4', fontWeight: 600, fontSize: '0.85rem' }}>{m.val}</div>
                      </div>
                    ))}
                  </div>

                  {data.available ? <BarChart data={data.chart} /> : (
                    <div style={{ background: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: '1rem', color: '#fbbf24', fontSize: '0.85rem' }}>
                      No market data available for selected district.
                    </div>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  className="glass" style={{ borderRadius: 18, padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <TrendingUp size={18} color="#fbbf24" />
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.88rem' }}>AI Price Prediction</span>
                  </div>
                  <p style={{ color: '#86efac', fontSize: '0.9rem', lineHeight: 1.6 }}>{data.ai_prediction}</p>
                  <p style={{ color: '#4b7a58', fontSize: '0.72rem', marginTop: '0.75rem' }}>Region: {data.location || regionLabel} · Updated: {data.updated_at ? new Date(data.updated_at).toLocaleString() : 'just now'}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="glass" style={{ borderRadius: 18, padding: '1.25rem' }}>
                  <h3 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>Markets in {data.location || regionLabel}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {(data.top_markets?.length ? data.top_markets : [{ name: 'No market data available for selected district', distance_km: '-', price: null }]).map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                        <div>
                          <div style={{ color: '#f0fdf4', fontWeight: 600, fontSize: '0.88rem' }}>{m.name}</div>
                          <div style={{ color: '#4b7a58', fontSize: '0.75rem' }}>{m.distance_km}</div>
                        </div>
                        <div style={{ color: '#4ade80', fontWeight: 700 }}>{m.price ? `Rs ${m.price.toLocaleString()}` : '-'}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {trending.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ color: '#f0fdf4', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Trending Today in {regionLabel}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.75rem' }}>
              {trending.map((t, i) => (
                <motion.div key={i} whileHover={{ y: -4 }} onClick={() => select(t.crop)}
                  className="glass glass-hover" style={{ borderRadius: 14, padding: '1rem', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ color: '#f0fdf4', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>{t.crop}</div>
                  <div style={{ color: '#86efac', fontWeight: 700, fontSize: '1rem' }}>Rs {t.price?.toLocaleString()}</div>
                  <div style={{ color: t.change >= 0 ? '#4ade80' : '#f87171', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {t.change >= 0 ? 'Up' : 'Down'} {Math.abs(t.change)}%
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
