'use client';

import { useKeyboardNav } from '@/hooks/useKeyboardNav';

interface Props {
  prevSlug: string | null;
  nextSlug: string | null;
}

/**
 * Invisible component that enables ← → keyboard navigation.
 * Renders a small hint at the bottom of the page.
 */
export default function KeyboardNavHint({ prevSlug, nextSlug }: Props) {
  useKeyboardNav({ prevSlug, nextSlug });

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 hidden lg:block">
      <div className="flex items-center gap-4 px-3 py-1.5 rounded-full bg-surface/80 border border-border backdrop-blur-sm text-[10px] text-muted/60">
        {prevSlug ? (
          <span>← Prev</span>
        ) : (
          <span className="opacity-30">← Prev</span>
        )}
        <span className="w-1 h-1 rounded-full bg-muted/30" />
        {nextSlug ? (
          <span>Next →</span>
        ) : (
          <span className="opacity-30">Next →</span>
        )}
      </div>
    </div>
  );
}