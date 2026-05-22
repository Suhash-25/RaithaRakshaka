import { motion } from 'framer-motion';
import { Crosshair, Layers, LocateFixed, Maximize2 } from 'lucide-react';

const LAYERS = [
  { id: 'street', label: 'Map' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'terrain', label: 'Terrain' },
];

export default function SatelliteControls({ activeLayer, onLayerChange, onLocate, onFullscreen }) {
  return (
    <div className="satellite-controls">
      <div className="control-title"><Layers size={14} /> Layers</div>
      <div className="layer-segments">
        {LAYERS.map((layer) => (
          <motion.button
            key={layer.id}
            whileTap={{ scale: 0.94 }}
            className={activeLayer === layer.id ? 'active' : ''}
            onClick={() => onLayerChange(layer.id)}
          >
            {layer.label}
          </motion.button>
        ))}
      </div>
      <div className="map-action-row">
        <button onClick={onLocate} title="Detect current location"><LocateFixed size={16} /></button>
        <button onClick={onFullscreen} title="Fullscreen map"><Maximize2 size={16} /></button>
        <button title="AI zone scan"><Crosshair size={16} /></button>
      </div>
    </div>
  );
}
