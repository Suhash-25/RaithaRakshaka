import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Leaf, LayoutDashboard, Microscope, MessageSquare, Cloud, BookOpen, TrendingUp, Heart, Menu, X, Globe, Map, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_LINKS = [
  { path: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/disease', key: 'nav.disease', icon: Microscope },
  { path: '/chat', key: 'nav.chat', icon: MessageSquare },
  { path: '/weather', key: 'nav.weather', icon: Cloud },
  { path: '/map', key: 'nav.map', icon: Map },
  { path: '/schemes', key: 'nav.schemes', icon: BookOpen },
  { path: '/market', key: 'nav.market', icon: TrendingUp },
  { path: '/vendors', key: 'nav.vendors', icon: Store },
  { path: '/wellness', key: 'nav.wellness', icon: Heart },
];

const LANGS = [
  { code: 'en', key: 'language.english' },
  { code: 'hi', key: 'language.hindi' },
  { code: 'kn', key: 'language.kannada' },
];

export default function Navbar() {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const { language, setLanguage } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <nav className="navbar" style={{ boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none' }}>
        <div className="nav-shell">
          <div className="nav-main-row">
            <Link to="/" className="nav-brand">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="nav-brand-icon"
              >
                <Leaf size={20} color="white" />
              </motion.div>
              <div className="nav-brand-copy">
                <div className="nav-brand-title">KrishiRakshak</div>
                <div className="nav-brand-tagline">{t('app.tagline')}</div>
              </div>
            </Link>

            <div className="nav-actions">
              <div data-no-translate className="nav-language">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setLangOpen(v => !v)}
                  className="nav-language-button"
                >
                  <Globe size={14} />
                  <span>{t(LANGS.find(l => l.code === language)?.key || 'language.english')}</span>
                </motion.button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="nav-language-menu"
                    >
                      {LANGS.map(l => (
                        <button
                          key={l.code}
                          onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                          className={language === l.code ? 'active' : ''}
                        >
                          {t(l.key)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(v => !v)}
                className="nav-menu-button"
                aria-label={open ? 'Close navigation' : 'Open navigation'}
              >
                {open ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>

          <div className="nav-tab-rail" aria-label="Primary navigation">
            {NAV_LINKS.map(({ path, key, icon: Icon }) => {
              const active = pathname === path;
              return (
                <Link key={path} to={path} className={`nav-tab ${active ? 'active' : ''}`}>
                  <Icon size={16} />
                  <span>{t(key)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              position: 'fixed', top: '72px', left: 0, right: 0, zIndex: 99,
              background: 'rgba(2,11,3,0.97)', backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border)', padding: '1rem',
              maxHeight: 'calc(100vh - 72px)', overflowY: 'auto',
            }}
          >
            {NAV_LINKS.map(({ path, key, icon: Icon }, i) => (
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
                    <Icon size={18} /> {t(key)}
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
