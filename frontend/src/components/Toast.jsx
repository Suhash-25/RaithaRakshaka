import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ICONS = {
  success: { icon: CheckCircle, color: '#4ade80' },
  warning: { icon: AlertTriangle, color: '#fbbf24' },
  error:   { icon: XCircle, color: '#f87171' },
  info:    { icon: Info, color: '#93c5fd' },
};

export default function Toast() {
  const { toast, showToast } = useApp();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="toast"
          style={{ cursor: 'pointer' }}
          onClick={() => showToast(null)}
        >
          {(() => {
            const { icon: Icon, color } = ICONS[toast.type] || ICONS.info;
            return <Icon size={20} color={color} style={{ flexShrink: 0 }} />;
          })()}
          <span style={{ fontSize: '0.9rem', color: '#f0fdf4', flex: 1, lineHeight: 1.4 }}>
            {toast.message}
          </span>
          <X size={16} color="#4b7a58" style={{ flexShrink: 0 }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
