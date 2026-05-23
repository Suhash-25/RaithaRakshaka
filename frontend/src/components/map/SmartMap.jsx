import { useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { analyzeLocation, getVendors } from '../../services/api';
import { useApp } from '../../context/AppContext';
import IntelligencePanel from './IntelligencePanel';
import MapSearch from './MapSearch';
import SatelliteControls from './SatelliteControls';
import WeatherLayer from './WeatherLayer';

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
  },
};

const analysisIcon = L.divIcon({
  className: 'analysis-marker',
  html: '<div class="marker-glow"></div><div class="marker-dot"></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const vendorMapIcon = L.divIcon({
  className: 'vendor-marker',
  html: '<div class="vendor-marker-pulse"></div><div class="vendor-marker-core">AG</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function ClickAnalyzer({ onAnalyze }) {
  useMapEvents({
    click: (event) => onAnalyze(event.latlng),
  });
  return null;
}

export default function SmartMap() {
  const { t } = useTranslation(['maps', 'common', 'vendors']);
  const { language } = useApp();
  const mapRef = useRef(null);
  const [layer, setLayer] = useState('street');
  const [selected, setSelected] = useState({ lat: 13.1986, lng: 77.7066 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const tile = TILE_LAYERS[layer];

  const heatPoints = useMemo(() => {
    const active = data ? [{ lat: data.basic.latitude, lng: data.basic.longitude, risk: Math.max(data.agriculture.drought_risk, data.agriculture.disease_risk), label: data.basic.region }] : [];
    return [...active, ...markers.slice(-4).map((m) => ({ ...m, risk: m.risk || 35 }))];
  }, [data, markers]);

  const runAnalysis = async ({ lat, lng }) => {
    setSelected({ lat, lng });
    setLoading(true);
    try {
      const result = await analyzeLocation(lat, lng);
      setData(result);
      getVendors({ latitude: lat, longitude: lng, radius: 8000, category: 'all', language })
        .then((vendorData) => setVendors(vendorData.vendors || []))
        .catch(() => setVendors([]));
      setMarkers((prev) => [
        ...prev,
        {
          lat,
          lng,
          label: result.basic.region,
          risk: Math.max(result.agriculture.drought_risk, result.agriculture.disease_risk),
        },
      ].slice(-8));
    } finally {
      setLoading(false);
    }
  };

  const goTo = ({ lat, lng }) => {
    mapRef.current?.flyTo([lat, lng], 13, { duration: 1.1 });
    runAnalysis({ lat, lng });
  };

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => goTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => goTo(selected),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const fullscreen = () => {
    document.querySelector('.smart-map-shell')?.requestFullscreen?.();
  };

  return (
    <div className="smart-map-shell">
      <div className="map-hud">
        <div>
          <span>{t('eyebrow')}</span>
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
      </div>
      <MapSearch onSelect={goTo} />
      <SatelliteControls activeLayer={layer} onLayerChange={setLayer} onLocate={locate} onFullscreen={fullscreen} />
      <MapContainer
        center={[selected.lat, selected.lng]}
        zoom={11}
        minZoom={4}
        scrollWheelZoom
        className="smart-leaflet-map"
        ref={mapRef}
      >
        <TileLayer key={layer} url={tile.url} attribution={tile.attribution} />
        <ClickAnalyzer onAnalyze={runAnalysis} />
        <WeatherLayer points={heatPoints} />
        {markers.map((marker, index) => (
          <Marker key={`${marker.lat}-${marker.lng}-${index}`} position={[marker.lat, marker.lng]} icon={analysisIcon}>
            <Popup>{marker.label}<br />{t('riskScan', { risk: marker.risk })}</Popup>
          </Marker>
        ))}
        {vendors.slice(0, 12).map((vendor) => (
          <Marker key={vendor.id} position={[vendor.latitude, vendor.longitude]} icon={vendorMapIcon}>
            <Popup>
              <strong>{vendor.name}</strong><br />
              {vendor.category}<br />
              {t('away', { ns: 'vendors', distance: vendor.distance_km })}<br />
              <a href={vendor.maps_url} target="_blank" rel="noreferrer">{t('actions.openInMaps', { ns: 'common' })}</a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="map-bottom-ticker">
        <span>{t('ticker.weather')}</span>
        <span>{t('ticker.geocoding')}</span>
        <span>{t('ticker.terrain')}</span>
        <span>{t('ticker.ndvi')}</span>
        <span>{t('ticker.advisory')}</span>
      </div>
      <IntelligencePanel data={data} loading={loading} onClose={() => setData(null)} />
    </div>
  );
}
