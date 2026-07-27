'use client';

import { useEffect, useState, useRef } from 'react';
import type { Heading } from '@/lib/article';

interface TocProps {
  headings: Heading[];
}

/**
 * Floating table of contents — shows h2/h3 headings with active tracking.
 * Sticks to the right side on large screens, collapses on mobile.
 */
export default function Toc({ headings }: TocProps) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const ids = headings.map((h) => h.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="hidden xl:block fixed right-[max(2rem,calc(50%-42rem))] top-28 w-56"
    >
      <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-3">
        On this page
      </h3>
      <ul className="space-y-1 border-l border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`block text-sm py-1 pl-4 border-l-2 transition-all ${
                h.level === 3 ? 'pl-8' : ''
              } ${
                activeId === h.id
                  ? 'border-accent text-foreground font-medium'
                  : 'border-transparent text-muted hover:text-foreground hover:border-muted'
              }`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
