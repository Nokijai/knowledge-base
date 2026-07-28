'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
}

export default function ProgressBar({ current, total, showLabel = true }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-blue-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted font-mono whitespace-nowrap tabular-nums">
          {current}/{total}
        </span>
      )}
    </div>
  );
}
