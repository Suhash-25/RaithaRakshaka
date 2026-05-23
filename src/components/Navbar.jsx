import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, LayoutDashboard, Microscope, MessageSquare, Cloud, BookOpen, TrendingUp, Heart, Menu, X, Globe, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import T from './T';

const NAV_LINKS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/disease',   label: 'Disease AI', icon: Microscope },
  { path: '/chat',      label: 'AI Chat',    icon: MessageSquare },
  { path: '/weather',   label: 'Weather',    icon: Cloud },
  { path: '/schemes',   label: 'Schemes',    icon: BookOpen },
  { path: '/market',    label: 'Market',     icon: TrendingUp },
  { path: '/wellness',  label: 'Wellness',   icon: Heart },
];

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { language, setLanguage } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const changeWebsiteLanguage = (code) => {
    setLanguage(code);
    setLangOpen(false);
    
    // Trigger Google Translate hidden combo box
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    } else {
      // Fallback if script hasn't loaded fully
      document.cookie = `googtrans=/en/${code}; path=/`;
      window.location.reload();
    }
  };

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <nav className="navbar" style={{ boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none' }}>
        <div className="content-wrapper" style={{ padding: '0 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                style={{
                  width: 38, height: 38, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #166534, #22c55e)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
                }}
              >
                <Leaf size={20} color="white" />
              </motion.div>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: '#f0fdf4', lineHeight: 1 }}>
                  KrishiRakshak
                </div>
                <div style={{ fontSize: '0.6rem', color: '#4ade80', fontWeight: 600, letterSpacing: '0.08em' }}>AI FARMER PLATFORM</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden md:flex">
              {NAV_LINKS.map(({ path, label, icon: Icon }) => {
                const active = pathname === path;
                return (
                  <Link key={path} to={path} style={{ textDecoration: 'none' }}>
                    <motion.div
                      whileHover={{ y: -1 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.45rem 0.8rem', borderRadius: '10px',
                        fontSize: '0.82rem', fontWeight: 500,
                        color: active ? '#4ade80' : '#86efac',
                        background: active ? 'rgba(34,197,94,0.12)' : 'transparent',
                        border: active ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={14} />
                      <T>{label}</T>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              
              {/* Install PWA Button */}
              {deferredPrompt && (
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  onClick={handleInstall}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e',
                    borderRadius: '10px', padding: '0.45rem 0.75rem',
                    color: '#4ade80', fontSize: '0.82rem', cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Install App</span>
                </motion.button>
              )}

              {/* Language switcher */}
              <div style={{ position: 'relative' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setLangOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '0.45rem 0.75rem',
                    color: '#86efac', fontSize: '0.82rem', cursor: 'pointer',
                  }}
                >
                  <Globe size={14} />
                  {LANGS.find(l => l.code === language)?.label || 'EN'}
                </motion.button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      style={{
                        position: 'absolute', top: '110%', right: 0, zIndex: 200,
                        background: '#050f06', border: '1px solid var(--border)',
                        borderRadius: '12px', overflow: 'hidden', minWidth: '120px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      }}
                    >
                      {LANGS.map(l => (
                        <button
                          key={l.code}
                          onClick={() => changeWebsiteLanguage(l.code)}
                          style={{
                            display: 'block', width: '100%', padding: '0.6rem 1rem',
                            textAlign: 'left', background: language === l.code ? 'rgba(34,197,94,0.1)' : 'transparent',
                            color: language === l.code ? '#4ade80' : '#86efac',
                            fontSize: '0.85rem', cursor: 'pointer', border: 'none',
                            fontFamily: 'Inter', transition: 'background 0.2s',
                          }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/dashboard" style={{ textDecoration: 'none' }} className="hidden md:block">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>
                  Open Dashboard
                </motion.button>
              </Link>

              {/* Mobile hamburger */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(v => !v)}
                className="md:hidden"
                style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer', padding: '0.25rem' }}
              >
                {open ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              position: 'fixed', top: '68px', left: 0, right: 0, zIndex: 99,
              background: 'rgba(2,11,3,0.97)', backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border)', padding: '1rem',
            }}
          >
            {NAV_LINKS.map(({ path, label, icon: Icon }, i) => (
              <motion.div
                key={path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={path} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.85rem 1rem', borderRadius: '12px',
                    color: pathname === path ? '#4ade80' : '#86efac',
                    background: pathname === path ? 'rgba(34,197,94,0.1)' : 'transparent',
                    marginBottom: '0.25rem', fontSize: '0.95rem',
                  }}>
                    <Icon size={18} /> {label}
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
