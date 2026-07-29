'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseKeyboardNavOptions {
  prevSlug: string | null;
  nextSlug: string | null;
  enabled?: boolean;
}

/**
 * Listen for ← / → arrow keys to navigate between prev/next articles.
 */
export function useKeyboardNav({ prevSlug, nextSlug, enabled = true }: UseKeyboardNavOptions) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    function handler(e: KeyboardEvent) {
      // Don't trigger when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowLeft' && prevSlug) {
        e.preventDefault();
        router.push(`/${prevSlug}`);
      } else if (e.key === 'ArrowRight' && nextSlug) {
        e.preventDefault();
        router.push(`/${nextSlug}`);
      }
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [prevSlug, nextSlug, enabled, router]);
}