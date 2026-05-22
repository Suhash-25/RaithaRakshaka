import { Droplets, FlaskConical, Gauge, Sprout } from 'lucide-react';

export default function SoilAnalysisCard({ soil }) {
  if (!soil) return null;
  const stats = [
    { label: 'Moisture', value: `${soil.moisture}%`, icon: Droplets, color: '#60a5fa' },
    { label: 'pH', value: soil.ph, icon: FlaskConical, color: '#fbbf24' },
    { label: 'Fertility', value: soil.fertility, icon: Sprout, color: '#4ade80' },
    { label: 'NPK', value: `${soil.nitrogen}/${soil.phosphorus}/${soil.potassium}`, icon: Gauge, color: '#a78bfa' },
  ];
  return (
    <div className="intel-card">
      <div className="intel-card-title">Soil Intelligence</div>
      <div className="soil-type">{soil.type}</div>
      <div className="mini-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="mini-stat">
            <Icon size={15} color={color} />
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
