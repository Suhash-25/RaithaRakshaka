import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Filter, Loader, MapPin, Navigation, Phone, Search, Star, Store } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { getVendors, translateDynamicPayload } from '../services/api';
import { useApp } from '../context/AppContext';

const CATEGORIES = [
  { id: 'all', key: 'categories.all' },
  { id: 'seeds', key: 'categories.seeds' },
  { id: 'fertilizers', key: 'categories.fertilizers' },
  { id: 'irrigation', key: 'categories.irrigation' },
  { id: 'equipment', key: 'categories.equipment' },
  { id: 'soil', key: 'categories.soil' },
];

const vendorIcon = L.divIcon({
  className: 'vendor-marker',
  html: '<div class="vendor-marker-pulse"></div><div class="vendor-marker-core">AG</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function MapClickSearch({ onPick }) {
  useMapEvents({ click: (event) => onPick(event.latlng) });
  return null;
}

function VendorCard({ vendor }) {
  const { t } = useTranslation(['vendors', 'common']);
  return (
    <motion.div layout whileHover={{ y: -3 }} className="glass glass-hover vendor-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <Store size={16} color="#4ade80" />
            <h3 style={{ color: '#f0fdf4', fontSize: '1rem', fontWeight: 800 }}>{vendor.name}</h3>
          </div>
          <div style={{ color: '#86efac', fontSize: '0.78rem', fontWeight: 700 }}>{vendor.category}</div>
        </div>
        <div style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
          <Star size={13} /> {vendor.rating || t('ratingFallback')}
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.85rem', color: '#9ae6b4', fontSize: '0.82rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}><MapPin size={14} color="#4b7a58" /><span>{vendor.address}</span></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}><Navigation size={14} color="#4b7a58" /><span>{t('away', { distance: vendor.distance_km })}</span></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}><Phone size={14} color="#4b7a58" /><span>{vendor.phone || t('phoneMissing')}</span></div>
      </div>
      <a href={vendor.maps_url} target="_blank" rel="noreferrer" className="vendor-map-link">
        {t('actions.openInMaps', { ns: 'common' })} <ExternalLink size={14} />
      </a>
    </motion.div>
  );
}

export default function VendorsPage() {
  const { selectedLocation, setSelectedLocation, language } = useApp();
  const { t } = useTranslation(['vendors', 'common']);
  const [query, setQuery] = useState(selectedLocation?.district || 'Mysore');
  const [category, setCategory] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  const center = useMemo(() => {
    const loc = data?.location;
    return [loc?.latitude || 12.2958, loc?.longitude || 76.6394];
  }, [data]);

  const load = async (nextQuery = query, nextCategory = category, coords = null) => {
    if (!coords && !String(nextQuery || '').trim()) return;
    setLoading(true);
    setError('');
    try {
      const raw = await getVendors({
        location: coords ? undefined : nextQuery,
        latitude: coords?.lat,
        longitude: coords?.lng,
        category: nextCategory,
        radius: 12000,
        language,
      });
      const result = await translateDynamicPayload(raw, language);
      setData({ ...result });
      setSelectedLocation({
        district: result.location?.district || nextQuery,
        state: result.location?.state || selectedLocation?.state || 'Karnataka',
        mandi: result.location?.district || nextQuery,
        coordinates: { latitude: result.location?.latitude, longitude: result.location?.longitude },
      });
      if (result.location?.latitude && result.location?.longitude) {
        mapRef.current?.flyTo([result.location.latitude, result.location.longitude], 12, { duration: 0.9 });
      }
    } catch (exc) {
      setError(exc?.response?.data?.detail || t('error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedLocation?.district || query, category);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query.trim().length >= 3) load(query, category);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [query, category, language]);

  const changeCategory = (next) => {
    setCategory(next);
    load(query, next);
  };

  const pickMapPoint = ({ lat, lng }) => {
    setQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    load(query, category, { lat, lng });
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="vendor-hero">
          <div>
            <div className="section-label">{t('eyebrow')}</div>
            <h1>{t('title')}</h1>
            <p>{t('subtitle')}</p>
          </div>
          <div className="vendor-search-panel">
            <div className="vendor-search">
              <Search size={16} color="#4ade80" />
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder={t('placeholder')} />
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => load()} disabled={loading}>
                {loading ? <Loader size={15} className="spin" /> : t('actions.find', { ns: 'common' })}
              </motion.button>
            </div>
            <div className="live-pill" style={{ width: 'fit-content' }}>
              <span className={loading ? 'live-dot loading' : 'live-dot'} />
              <span>{data?.source || t('sourceFallback')}</span>
            </div>
          </div>
        </div>

        <div className="vendor-category-row">
          <Filter size={15} color="#4ade80" />
          {CATEGORIES.map(item => (
            <button key={item.id} onClick={() => changeCategory(item.id)} className={category === item.id ? 'active' : ''}>
              {t(item.key)}
            </button>
          ))}
        </div>

        {error && <div className="glass" style={{ borderRadius: 14, padding: '1rem', color: '#fbbf24', marginBottom: '1rem' }}>{error}</div>}

        <div className="vendor-layout">
          <div className="vendor-map-shell">
            <MapContainer center={center} zoom={12} scrollWheelZoom className="vendor-map" ref={mapRef}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <MapClickSearch onPick={pickMapPoint} />
              {data?.vendors?.map(vendor => (
                <Marker key={vendor.id} position={[vendor.latitude, vendor.longitude]} icon={vendorIcon}>
                  <Popup>
                    <strong>{vendor.name}</strong><br />
                    {vendor.category}<br />
                    {t('away', { distance: vendor.distance_km })}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="vendor-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', gap: '1rem' }}>
              <div>
                <h2 style={{ color: '#f0fdf4', fontSize: '1rem', fontWeight: 800 }}>{t('near', { location: data?.location?.district || query })}</h2>
                <p style={{ color: '#4b7a58', fontSize: '0.78rem' }}>{t('count', { count: data?.count || 0, radius: (data?.radius_m || 12000) / 1000 })}</p>
              </div>
            </div>
            {loading && !data ? (
              [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 14, marginBottom: '0.75rem' }} />)
            ) : data?.vendors?.length ? (
              data.vendors.map(vendor => <VendorCard key={vendor.id} vendor={vendor} />)
            ) : (
              <div className="glass" style={{ borderRadius: 14, padding: '1.25rem', color: '#fbbf24' }}>{t('empty')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
