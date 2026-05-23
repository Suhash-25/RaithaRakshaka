import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { ExternalLink, Filter, Loader, MapPin, Navigation, Phone, Search, Star, Store } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { getVendors } from '../services/api';
import { useApp } from '../context/AppContext';

const CATEGORIES = [
  { id: 'all', label: 'All Vendors' },
  { id: 'seeds', label: 'Seeds' },
  { id: 'fertilizers', label: 'Fertilizers' },
  { id: 'irrigation', label: 'Irrigation' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'soil', label: 'Soil Testing' },
];

const vendorIcon = L.divIcon({
  className: 'vendor-marker',
  html: '<div class="vendor-marker-pulse"></div><div class="vendor-marker-core">🌾</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function VendorCard({ vendor }) {
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
          <Star size={13} /> {vendor.rating || 'OSM'}
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.85rem', color: '#9ae6b4', fontSize: '0.82rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}><MapPin size={14} color="#4b7a58" /><span>{vendor.address}</span></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}><Navigation size={14} color="#4b7a58" /><span>{vendor.distance_km} km away</span></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}><Phone size={14} color="#4b7a58" /><span>{vendor.phone || 'Phone not listed'}</span></div>
      </div>
      <a href={vendor.maps_url} target="_blank" rel="noreferrer" className="vendor-map-link">
        Open in Maps <ExternalLink size={14} />
      </a>
    </motion.div>
  );
}

export default function VendorsPage() {
  const { selectedLocation, setSelectedLocation } = useApp();
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

  const load = async (nextQuery = query, nextCategory = category) => {
    if (!nextQuery.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await getVendors({ location: nextQuery, category: nextCategory, radius: 12000 });
      setData(result);
      setSelectedLocation({
        district: result.location?.district || nextQuery,
        state: result.location?.state || selectedLocation?.state || 'Karnataka',
        mandi: result.location?.district || nextQuery,
        coordinates: { latitude: result.location?.latitude, longitude: result.location?.longitude },
      });
      mapRef.current?.flyTo([result.location.latitude, result.location.longitude], 12, { duration: 0.9 });
    } catch (exc) {
      setError(exc?.response?.data?.detail || 'Could not fetch nearby vendors for this location.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedLocation?.district || query, category);
  }, []);

  const changeCategory = (next) => {
    setCategory(next);
    load(query, next);
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="vendor-hero">
          <div>
            <div className="section-label">LIVE AGRITECH DISCOVERY</div>
            <h1>Nearby AgriTech Stores & Vendors</h1>
            <p>Find real seed shops, fertilizer vendors, irrigation suppliers, equipment dealers, and agri-service centers near the selected location.</p>
          </div>
          <div className="vendor-search-panel">
            <div className="vendor-search">
              <Search size={16} color="#4ade80" />
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search city, village, district, pincode..." />
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => load()} disabled={loading}>
                {loading ? <Loader size={15} className="spin" /> : 'Find'}
              </motion.button>
            </div>
            <div className="live-pill" style={{ width: 'fit-content' }}>
              <span className={loading ? 'live-dot loading' : 'live-dot'} />
              <span>{data?.source || 'OpenStreetMap Overpass live data'}</span>
            </div>
          </div>
        </div>

        <div className="vendor-category-row">
          <Filter size={15} color="#4ade80" />
          {CATEGORIES.map(item => (
            <button key={item.id} onClick={() => changeCategory(item.id)} className={category === item.id ? 'active' : ''}>
              {item.label}
            </button>
          ))}
        </div>

        {error && <div className="glass" style={{ borderRadius: 14, padding: '1rem', color: '#fbbf24', marginBottom: '1rem' }}>{error}</div>}

        <div className="vendor-layout">
          <div className="vendor-map-shell">
            <MapContainer center={center} zoom={12} scrollWheelZoom className="vendor-map" ref={mapRef}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              {data?.vendors?.map(vendor => (
                <Marker key={vendor.id} position={[vendor.latitude, vendor.longitude]} icon={vendorIcon}>
                  <Popup>
                    <strong>{vendor.name}</strong><br />
                    {vendor.category}<br />
                    {vendor.distance_km} km away
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="vendor-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', gap: '1rem' }}>
              <div>
                <h2 style={{ color: '#f0fdf4', fontSize: '1rem', fontWeight: 800 }}>Vendors near {data?.location?.district || query}</h2>
                <p style={{ color: '#4b7a58', fontSize: '0.78rem' }}>{data?.count || 0} real map results within {(data?.radius_m || 12000) / 1000} km</p>
              </div>
            </div>
            {loading && !data ? (
              [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 14, marginBottom: '0.75rem' }} />)
            ) : data?.vendors?.length ? (
              data.vendors.map(vendor => <VendorCard key={vendor.id} vendor={vendor} />)
            ) : (
              <div className="glass" style={{ borderRadius: 14, padding: '1.25rem', color: '#fbbf24' }}>
                No real agritech vendors were returned by OpenStreetMap for this selected location/category. Try a larger nearby town or another category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
