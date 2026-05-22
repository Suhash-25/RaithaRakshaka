import { Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const weatherIcon = L.divIcon({
  className: 'weather-pulse-marker',
  html: '<div class="weather-core"></div><div class="weather-ring"></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

export default function WeatherLayer({ points = [] }) {
  return (
    <>
      {points.map((point) => {
        const risk = point.risk || 35;
        const color = risk > 70 ? '#ef4444' : risk > 45 ? '#f59e0b' : '#22c55e';
        return (
          <div key={`${point.lat}-${point.lng}`}>
            <Circle
              center={[point.lat, point.lng]}
              radius={Math.max(900, risk * 55)}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 1 }}
            />
            <Marker position={[point.lat, point.lng]} icon={weatherIcon}>
              <Popup>
                <strong>{point.label || 'Analyzed land'}</strong><br />
                Risk score: {risk}%
              </Popup>
            </Marker>
          </div>
        );
      })}
    </>
  );
}
