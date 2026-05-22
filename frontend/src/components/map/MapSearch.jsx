import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader, MapPin } from 'lucide-react';

export default function MapSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-search">
      <div className="map-search-input">
        <Search size={16} color="#4ade80" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search village, city, farm..."
        />
        <motion.button whileTap={{ scale: 0.94 }} onClick={search} disabled={loading}>
          {loading ? <Loader size={15} className="spin" /> : 'Scan'}
        </motion.button>
      </div>
      {results.length > 0 && (
        <div className="map-search-results">
          {results.map((item) => (
            <button
              key={item.place_id}
              onClick={() => {
                onSelect({ lat: Number(item.lat), lng: Number(item.lon), label: item.display_name });
                setResults([]);
                setQuery(item.display_name.split(',').slice(0, 2).join(', '));
              }}
            >
              <MapPin size={14} />
              <span>{item.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
