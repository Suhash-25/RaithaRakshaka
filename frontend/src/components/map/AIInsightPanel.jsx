import { motion } from 'framer-motion';
import { BrainCircuit, CheckCircle2 } from 'lucide-react';

export default function AIInsightPanel({ ai }) {
  if (!ai) return null;
  return (
    <motion.div className="ai-insight-panel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div className="ai-heading"><BrainCircuit size={18} /> AI Farming Intelligence</div>
      <p>{ai.summary}</p>
      <div className="ai-list">
        {ai.recommendations?.map((item, index) => (
          <div key={index}>
            <CheckCircle2 size={15} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
