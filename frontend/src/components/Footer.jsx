import { Link } from 'react-router-dom';
import { Leaf, Twitter, Github, Linkedin, Phone, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const FEATURE_LINKS = [
  { label: 'Disease Detection', path: '/disease' },
  { label: 'AI Assistant', path: '/chat' },
  { label: 'Weather Alerts', path: '/weather' },
  { label: 'Govt Schemes', path: '/schemes' },
  { label: 'Market Insights', path: '/market' },
  { label: 'Wellness Support', path: '/wellness' },
];

const RESOURCE_LINKS = [
  { label: 'PM-KISAN', href: 'https://pmkisan.gov.in' },
  { label: 'PMFBY Insurance', href: 'https://pmfby.gov.in' },
  { label: 'eNAM Market', href: 'https://www.enam.gov.in' },
  { label: 'Kisan Sarathi', href: 'https://kisansarathi.in' },
];

export default function Footer() {
  const { t } = useTranslation('common');
  const helplines = [
    { icon: Phone, text: 'Kisan Helpline: 1800-180-1551', color: '#4ade80' },
    { icon: Phone, text: 'PM-KISAN: 155261', color: '#4ade80' },
    { icon: Mail, text: 'support@krishirakshak.ai', color: '#93c5fd' },
    { icon: MapPin, text: t('footer.panIndia'), color: '#fbbf24' },
  ];

  return (
    <footer style={{ background: 'linear-gradient(to top, #020b03, #030d04)', borderTop: '1px solid rgba(34,197,94,0.1)', marginTop: '4rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 1.5rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #166534, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={20} color="white" />
              </div>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: '#f0fdf4' }}>KrishiRakshak</div>
                <div style={{ fontSize: '0.6rem', color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('app.tagline')}</div>
              </div>
            </div>
            <p style={{ color: '#4b7a58', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>{t('footer.description')}</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <motion.div key={i} whileHover={{ y: -3, scale: 1.1 }} style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Icon size={16} color="#4ade80" />
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: '#f0fdf4', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>{t('footer.features')}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {FEATURE_LINKS.map(l => (
                <li key={l.path}><Link to={l.path} style={{ color: '#4b7a58', fontSize: '0.85rem', textDecoration: 'none' }}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#f0fdf4', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>{t('footer.resources')}</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {RESOURCE_LINKS.map(l => (
                <li key={l.label}><a href={l.href} target="_blank" rel="noreferrer" style={{ color: '#4b7a58', fontSize: '0.85rem', textDecoration: 'none' }}>{l.label}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#f0fdf4', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>{t('footer.helplines')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {helplines.map(({ icon: Icon, text, color }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon size={14} color={color} />
                  <span style={{ color: '#4b7a58', fontSize: '0.82rem' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(34,197,94,0.08)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: '#4b7a58', fontSize: '0.8rem' }}>{t('footer.copyright')}</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[t('footer.privacy'), t('footer.terms'), t('footer.accessibility')].map(item => (
              <span key={item} style={{ color: '#4b7a58', fontSize: '0.8rem', cursor: 'pointer' }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
