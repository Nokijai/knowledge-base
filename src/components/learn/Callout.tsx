'use client';

import { useState } from 'react';

interface CalloutProps {
  type?: 'info' | 'tip' | 'warning' | 'exercise';
  title?: string;
  children: React.ReactNode;
}

const styles: Record<string, { border: string; bg: string; icon: string; title: string }> = {
  info: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    icon: 'i',
    title: 'Note',
  },
  tip: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    icon: '✦',
    title: 'Tip',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    icon: '⚠',
    title: 'Warning',
  },
  exercise: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/5',
    icon: '▶',
    title: 'Exercise',
  },
};

export default function Callout({ type = 'info', title, children }: CalloutProps) {
  const s = styles[type];
  const [isOpen, setIsOpen] = useState(type !== 'exercise');

  return (
    <div
      className={`my-5 rounded-xl border ${s.border} ${s.bg} overflow-hidden transition-all`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
      >
        <span className={type === 'exercise' ? 'text-purple-400' : type === 'warning' ? 'text-amber-400' : type === 'tip' ? 'text-emerald-400' : 'text-blue-400'}>
          {s.icon}
        </span>
        <span>{title || s.title}</span>
        {type === 'exercise' && (
          <svg
            className={`w-3.5 h-3.5 ml-auto transition-transform ${isOpen ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 text-sm text-muted leading-relaxed prose prose-invert prose-sm max-w-none prose-p:mb-1.5">
          {children}
        </div>
      )}
    </div>
  );
}
