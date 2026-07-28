'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface LessonNav {
  slug: string;
  title: string;
  unit: string;
}

interface LessonNavigationProps {
  trackSlug: string;
  prevLesson: LessonNav | null;
  nextLesson: LessonNav | null;
}

export default function LessonNavigation({ trackSlug, prevLesson, nextLesson }: LessonNavigationProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mt-14 pt-8 border-t border-border"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {prevLesson ? (
            <Link
              href={`/learn/${trackSlug}/${prevLesson.unit}/${prevLesson.slug}`}
              className="group flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center group-hover:border-accent/50 group-hover:bg-accent/5 transition-all shrink-0">
                <svg className="w-4 h-4 text-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted/60 mb-0.5">Previous</div>
                <div className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                  {prevLesson.title}
                </div>
              </div>
            </Link>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 text-right">
          {nextLesson ? (
            <Link
              href={`/learn/${trackSlug}/${nextLesson.unit}/${nextLesson.slug}`}
              className="group flex items-center justify-end gap-3"
            >
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted/60 mb-0.5">Next</div>
                <div className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                  {nextLesson.title}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center group-hover:border-accent/50 group-hover:bg-accent/5 transition-all shrink-0">
                <svg className="w-4 h-4 text-muted group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Back to course map */}
      <div className="text-center mt-6">
        <Link
          href={`/learn/${trackSlug}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Course Map
        </Link>
      </div>
    </motion.nav>
  );
}
