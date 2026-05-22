import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { getSchemes } from '../services/api';
import { useApp } from '../context/AppContext';

const STATES = ['Karnataka','Maharashtra','Punjab','Uttar Pradesh','Rajasthan','Tamil Nadu','Andhra Pradesh','Telangana','Gujarat','Madhya Pradesh','Bihar','Odisha'];
const CROPS = ['Tomato','Rice','Wheat','Maize','Cotton','Onion','Potato','Sugarcane','Soybean','Groundnut','Turmeric','Banana'];
const CAT_COLOR = { 'Financial Support':'#22c55e','Crop Insurance':'#60a5fa','Agricultural Loan':'#fbbf24','Energy & Irrigation':'#f59e0b','Farm Equipment':'#a78bfa' };

function SchemeCard({ s, i }) {
  const [open, setOpen] = useState(false);
  const color = CAT_COLOR[s.category] || '#4ade80';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
      className={`scheme-card ${s.status === 'Eligible' ? 'eligible' : ''}`}
      style={{ borderRadius: 16, cursor: 'pointer' }} onClick={() => setOpen(v => !v)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
            <span style={{ color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 999, padding: '0.15rem 0.6rem', fontSize: '0.7rem', fontWeight: 700 }}>{s.category}</span>
            <span className={s.status === 'Eligible' ? 'badge-success' : 'badge-warning'}>{s.status === 'Eligible' ? '✅ Eligible' : '⚠️ Check'}</span>
          </div>
          <h3 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{s.name}</h3>
          <p style={{ color: '#4b7a58', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{s.full_name}</p>
          <p style={{ color, fontWeight: 600, fontSize: '0.88rem' }}>{s.benefit}</p>
        </div>
        <div style={{ marginLeft: '1rem', flexShrink: 0 }}>
          {open ? <ChevronUp size={18} color="#4b7a58" /> : <ChevronDown size={18} color="#4b7a58" />}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
              <div>
                <p style={{ color: '#fbbf24', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem' }}>📋 Documents Required</p>
                {s.documents.map((d, j) => (
                  <div key={j} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem', alignItems: 'center' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <span style={{ color: '#86efac', fontSize: '0.8rem' }}>{d}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ color: '#60a5fa', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem' }}>🏛️ How to Apply</p>
                <p style={{ color: '#86efac', fontSize: '0.82rem', lineHeight: 1.6 }}>{s.how_to_apply}</p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#4b7a58', fontSize: '0.75rem' }}>🕐 {s.deadline}</span>
                  <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>✅ {s.success_rate} success rate</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', background: 'rgba(34,197,94,0.05)', borderRadius: 10, padding: '0.6rem 0.75rem' }}>
              <span style={{ color: '#4b7a58', fontSize: '0.75rem' }}>🌍 Impact: </span>
              <span style={{ color: '#4ade80', fontSize: '0.75rem' }}>{s.impact}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SchemesPage() {
  const { showToast } = useApp();
  const [form, setForm] = useState({ state: 'Karnataka', crop: 'Tomato', land_acres: 2, category: 'small' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const find = async () => {
    setLoading(true);
    try {
      const d = await getSchemes(form);
      setResult(d);
      showToast(`Found ${d.summary.eligible_count} eligible schemes!`, 'success');
    } catch {
      showToast('Could not fetch schemes. Showing demo data.', 'warning');
    } finally { setLoading(false); }
  };

  const filtered = result?.schemes?.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-label" style={{ marginBottom: '0.4rem' }}>Government Benefits</div>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#f0fdf4' }}>Scheme Finder AI</h1>
          <p style={{ color: '#4b7a58', fontSize: '0.88rem', marginTop: '0.3rem' }}>Discover government schemes, subsidies, and benefits you're eligible for</p>
        </div>

        {/* Form */}
        <motion.div className="glass" style={{ borderRadius: 20, padding: '1.75rem', marginBottom: '2rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 style={{ color: '#f0fdf4', fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Enter Your Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ color: '#4b7a58', fontSize: '0.78rem', display: 'block', marginBottom: '0.4rem' }}>State</label>
              <select className="input-field" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#4b7a58', fontSize: '0.78rem', display: 'block', marginBottom: '0.4rem' }}>Primary Crop</label>
              <select className="input-field" value={form.crop} onChange={e => setForm(f => ({ ...f, crop: e.target.value }))}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#4b7a58', fontSize: '0.78rem', display: 'block', marginBottom: '0.4rem' }}>Land (acres)</label>
              <input type="number" min="0.5" max="50" step="0.5" className="input-field" value={form.land_acres}
                onChange={e => setForm(f => ({ ...f, land_acres: parseFloat(e.target.value) }))} />
            </div>
            <div>
              <label style={{ color: '#4b7a58', fontSize: '0.78rem', display: 'block', marginBottom: '0.4rem' }}>Farmer Category</label>
              <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="small">Small (≤2 ha)</option>
                <option value="marginal">Marginal (≤1 ha)</option>
                <option value="large">Large (&gt;2 ha)</option>
              </select>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={find} disabled={loading}
            className="btn-primary" style={{ fontSize: '0.95rem', padding: '0.75rem 2rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? '🔍 Searching...' : <><BookOpen size={16} /> Find My Schemes</>}
          </motion.button>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Eligible Schemes', val: result.summary.eligible_count, color: '#22c55e', icon: '✅' },
                { label: 'Total Schemes', val: result.summary.total, color: '#4ade80', icon: '📋' },
                { label: 'Est. Annual Benefit', val: result.summary.estimated_benefit, color: '#fbbf24', icon: '💰' },
              ].map((s, i) => (
                <div key={i} className="stat-card" style={{ textAlign: 'left', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                  <div>
                    <div style={{ color: '#4b7a58', fontSize: '0.7rem' }}>{s.label}</div>
                    <div style={{ color: s.color, fontWeight: 700, fontSize: '1rem' }}>{s.val}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Search filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: '0.6rem 1rem', marginBottom: '1.25rem' }}>
              <Search size={16} color="#4b7a58" />
              <input placeholder="Search schemes..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', color: '#f0fdf4', fontSize: '0.9rem', fontFamily: 'Inter', flex: 1 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map((s, i) => <SchemeCard key={s.id} s={s} i={i} />)}
            </div>
          </motion.div>
        )}

        {!result && !loading && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ color: '#4b7a58', fontSize: '0.95rem' }}>Enter your details above to discover eligible government schemes</p>
          </div>
        )}
      </div>
    </div>
  );
}
