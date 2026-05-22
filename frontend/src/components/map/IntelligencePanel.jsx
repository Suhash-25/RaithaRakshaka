import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CloudRain, Compass, Droplets, Gauge, Leaf, MapPin, Mountain, Thermometer, Wind, X } from 'lucide-react';
import SoilAnalysisCard from './SoilAnalysisCard';
import AIInsightPanel from './AIInsightPanel';

function Metric({ icon: Icon, label, value, color = '#4ade80' }) {
  return (
    <div className="map-metric">
      <Icon size={16} color={color} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RiskBar({ label, value }) {
  const color = value > 70 ? '#ef4444' : value > 45 ? '#f59e0b' : '#22c55e';
  return (
    <div className="risk-row">
      <div><span>{label}</span><strong>{value}%</strong></div>
      <div className="risk-track"><div style={{ width: `${value}%`, background: color }} /></div>
    </div>
  );
}

export default function IntelligencePanel({ data, loading, onClose }) {
  return (
    <AnimatePresence>
      {(loading || data) && (
        <motion.aside
          className="intelligence-panel"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
        >
          <button className="panel-close" onClick={onClose}><X size={17} /></button>
          {loading ? (
            <div className="map-loading">
              <div className="scan-orb" />
              <h2>Scanning land parcel</h2>
              <p>Collecting weather, terrain, vegetation, and soil intelligence...</p>
            </div>
          ) : (
            <>
              <div className="panel-kicker">Live Land Intelligence</div>
              <h2>{data.basic.region}</h2>
              <div className="panel-subtitle">
                <MapPin size={14} /> {data.basic.state || data.basic.district || data.basic.country}
              </div>

              <div className="map-score-row">
                <div className="land-score">
                  <span>{data.satellite.land_health_score}</span>
                  <small>Land Health</small>
                </div>
                <div className="ndvi-orbit">
                  <span>{data.satellite.ndvi}</span>
                  <small>NDVI</small>
                </div>
              </div>

              <div className="metric-grid">
                <Metric icon={Compass} label="Latitude" value={data.basic.latitude} />
                <Metric icon={Compass} label="Longitude" value={data.basic.longitude} />
                <Metric icon={Mountain} label="Elevation" value={`${data.basic.elevation} m`} color="#a78bfa" />
                <Metric icon={Thermometer} label="Temp" value={`${data.weather.temperature} C`} color="#f87171" />
                <Metric icon={Droplets} label="Humidity" value={`${data.weather.humidity}%`} color="#60a5fa" />
                <Metric icon={CloudRain} label="Rainfall" value={`${data.weather.rainfall} mm`} color="#38bdf8" />
                <Metric icon={Wind} label="Wind" value={`${data.weather.wind_speed} km/h`} color="#86efac" />
                <Metric icon={Gauge} label="Pressure" value={`${data.weather.pressure} hPa`} color="#fbbf24" />
                <Metric icon={Activity} label="UV" value={data.weather.uv_index} color="#f59e0b" />
              </div>

              <SoilAnalysisCard soil={data.soil} />

              <div className="intel-card">
                <div className="intel-card-title">Agriculture Risk Zones</div>
                <RiskBar label="Drought Risk" value={data.agriculture.drought_risk} />
                <RiskBar label="Flood Risk" value={data.agriculture.flood_risk} />
                <RiskBar label="Pest Risk" value={data.agriculture.pest_risk} />
                <RiskBar label="Disease Risk" value={data.agriculture.disease_risk} />
              </div>

              <div className="intel-card">
                <div className="intel-card-title"><Leaf size={15} /> Suitable Crops</div>
                <div className="crop-chip-row">
                  {data.agriculture.suitable_crops.map((crop) => <span key={crop}>{crop}</span>)}
                </div>
                <p className="irrigation-copy">Irrigation: {data.agriculture.irrigation}</p>
              </div>

              <AIInsightPanel ai={data.ai} />
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
