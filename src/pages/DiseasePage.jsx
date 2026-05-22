import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, AlertTriangle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { detectDisease } from '../services/api';
import { useApp } from '../context/AppContext';

export default function DiseasePage() {
  const { showToast } = useApp();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'warning');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const d = await detectDisease(file);
      setResult(d);
      showToast('Analysis completed successfully!', 'success');
    } catch {
      showToast('API issue. Using mock disease analysis for demo.', 'warning');
      setResult({
        disease: "Tomato Early Blight",
        scientific_name: "Alternaria solani",
        confidence: 94.2,
        severity: "medium",
        diagnosis: "Fungal leaf spot disease causing brown concentric rings. Left untreated, it defoliates tomatoes and burns fruit stems.",
        treatment: {
          chemical: ["Copper oxychloride spray (50% WP) @ 3g/L", "Mancozeb (75% WP) @ 2g/L"],
          biological: ["Trichoderma viride bio-fungicide", "Neem oil spray (10,000 ppm) @ 5ml/L"],
          cultural: ["Prune lower leaves to enhance airflow", "Avoid overhead watering; use drip irrigation"]
        }
      });
    } finally { setLoading(false); }
  };

  const clear = () => { setFile(null); setPreview(''); setResult(null); };

  const drag = (e, val) => { e.preventDefault(); setDragOver(val); };

  const drop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const getSevClass = (s) => `severity-${s?.toLowerCase() || 'none'}`;

  return (
    <div className="page-container">
      <div className="content-wrapper" style={{ maxWidth: 850 }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '0.4rem' }}>Vision Intelligence</div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#f0fdf4' }}>Crop Disease Detection</h1>
            <p style={{ color: '#4b7a58', fontSize: '0.88rem', marginTop: '0.3rem' }}>Upload crop leaf photo for instant AI diagnosis and treatment recommendations</p>
          </div>
          {file && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={clear} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> Reset
            </motion.button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Upload panel */}
          <div>
            {!preview ? (
              <motion.div
                onDragOver={e => drag(e, true)}
                onDragLeave={e => drag(e, false)}
                onDrop={drop}
                onClick={() => inputRef.current?.click()}
                className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}
              >
                <input ref={inputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <Upload size={24} color="#4ade80" />
                </div>
                <h3 style={{ color: '#f0fdf4', fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Drag & Drop Leaf Photo</h3>
                <p style={{ color: '#4b7a58', fontSize: '0.78rem' }}>or click to browse local files (PNG, JPG up to 10MB)</p>
              </motion.div>
            ) : (
              <motion.div className="glass" style={{ borderRadius: 20, padding: '1rem', position: 'relative' }}>
                <img src={preview} alt="Leaf preview" style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 16 }} />
                <motion.button whileHover={{ scale: 1.1 }} onClick={clear}
                  style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={16} color="white" />
                </motion.button>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <motion.button whileHover={{ scale: 1.02 }} onClick={upload} disabled={loading}
                    className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.9rem' }}>
                    {loading ? 'Analyzing leaf...' : <><Sparkles size={16} /> Run AI Diagnosis</>}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Results panel */}
          <div>
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass" style={{ borderRadius: 20, padding: '2.5rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    style={{ width: 44, height: 44, border: '3px solid rgba(34,197,94,0.1)', borderTopColor: '#22c55e', borderRadius: '50%', margin: '0 auto 1.5rem' }} />
                  <h3 style={{ color: '#f0fdf4', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Scanning Leaf Structure</h3>
                  <p style={{ color: '#4b7a58', fontSize: '0.78rem' }}>Processing crop pigments, necrotic spot shapes, and tissue health...</p>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  className="glass animate-bounce-in" style={{ borderRadius: 20, padding: '1.5rem' }}>
                  {/* Title & confidence */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                    <div>
                      <span style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Diagnosis Result</span>
                      <h2 style={{ color: '#f0fdf4', fontWeight: 800, fontSize: '1.25rem', marginTop: '0.1rem' }}>{result.disease}</h2>
                      <span style={{ color: '#4b7a58', fontSize: '0.78rem', fontStyle: 'italic' }}>{result.scientific_name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge-success ${getSevClass(result.severity)}`} style={{ textTransform: 'capitalize', fontSize: '0.75rem', fontWeight: 700 }}>
                        {result.severity} Severity
                      </span>
                      <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.85rem', marginTop: '0.3rem' }}>
                        {result.confidence}% Match
                      </div>
                    </div>
                  </div>

                  <p style={{ color: '#86efac', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>{result.diagnosis}</p>

                  {/* Treatments */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {[
                      { title: 'Cultural Controls (Preventative)', items: result.treatment.cultural, icon: CheckCircle, color: '#4ade80' },
                      { title: 'Biological Solutions (Natural)', items: result.treatment.biological, icon: Sparkles, color: '#fbbf24' },
                      { title: 'Chemical Sprays (Emergency)', items: result.treatment.chemical, icon: ShieldAlert, color: '#f87171' },
                    ].map((sec, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <sec.icon size={14} color={sec.color} />
                          <h4 style={{ color: '#f0fdf4', fontWeight: 700, fontSize: '0.82rem' }}>{sec.title}</h4>
                        </div>
                        {sec.items.map((it, j) => (
                          <div key={j} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: sec.color, marginTop: '0.35rem', flexShrink: 0 }} />
                            <span style={{ color: '#86efac', fontSize: '0.78rem', lineHeight: 1.4 }}>{it}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {!result && !loading && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 20, padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍃</div>
                  <p style={{ color: '#4b7a58', fontSize: '0.85rem' }}>Diagnose leaf disease by uploading a photo in the upload panel</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
