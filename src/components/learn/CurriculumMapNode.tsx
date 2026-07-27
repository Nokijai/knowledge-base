'use client';

import { motion } from 'framer-motion';

interface CurriculumMapNodeProps {
  label: string;
  status: 'completed' | 'current' | 'locked';
  index: number;
  isLast?: boolean;
}

export default function CurriculumMapNode({ label, status, index, isLast }: CurriculumMapNodeProps) {
  const colors = {
    completed: {
      circle: 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
      line: 'bg-emerald-500/30',
      glow: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]',
    },
    current: {
      circle: 'bg-accent/20 border-accent text-accent',
      line: 'bg-border',
      glow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]',
    },
    locked: {
      circle: 'bg-surface border-border text-muted/40',
      line: 'bg-border',
      glow: '',
    },
  };

  const c = colors[status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: 'easeOut' }}
      className="flex items-start gap-3"
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 transition-all ${c.circle} ${c.glow}`}
        >
          {status === 'completed' ? '✓' : status === 'current' ? (index + 1) : (index + 1)}
        </div>
        {!isLast && <div className={`w-0.5 h-8 ${c.line}`} />}
      </div>

      {/* Label */}
      <div className={`pt-1 text-sm transition-colors ${
        status === 'locked' ? 'text-muted/40' : 'text-muted'
      }`}>
        {label}
      </div>
    </motion.div>
  );
}
