export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { getTracks, getTotalLessonCount } from '@/lib/learn';
import { getCategories } from '@/lib/content';

const trackColors: Record<string, string> = {
  swe: 'border-[#5e6ad2] bg-gradient-to-br from-[#5e6ad2]/10 to-transparent text-[#5e6ad2]',
  quant: 'border-[#f59e0b] bg-gradient-to-br from-[#f59e0b]/10 to-transparent text-[#f59e0b]',
};

const trackIcons: Record<string, string> = {
  swe: '◈',
  quant: '◆',
};

export default function LearnHub() {
  const tracks = getTracks();
  const totalLessons = getTotalLessonCount();
  const categories = getCategories();
  const mobileCategories = categories.map((c) => ({
    category: c.name,
    label: c.label,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  const overview = [
    { label: 'Tracks', value: tracks.length, icon: '⊞' },
    { label: 'Units', value: tracks.reduce((s, t) => s + t.units.length, 0), icon: '⊟' },
    { label: 'Lessons', value: totalLessons, icon: '⊡' },
  ];

  return (
    <>
      <Sidebar />
      <MobileHeader categories={mobileCategories} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16 max-lg:pt-20">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-2">Learn</h1>
            <p className="text-muted">
              University-level knowledge tracks — structured curricula built from the best open-source resources, with practical exercises.
            </p>
          </div>

          {/* Stats bar */}
          <div className="flex gap-8 mb-12 px-5 py-4 rounded-xl border border-border bg-surface/40">
            {overview.map((o) => (
              <div key={o.label} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center text-xs text-muted">
                  {o.icon}
                </span>
                <div>
                  <span className="text-xl font-bold text-foreground tabular-nums">{o.value}</span>
                  <span className="text-[10px] text-muted uppercase tracking-wider ml-2">{o.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Track cards */}
          <div className="grid gap-5">
            {tracks.map((track) => {
              const unitCount = track.units.length;
              const lessonCount = track.units.reduce((s, u) => s + u.lessons.length, 0);
              const colors = trackColors[track.slug] || 'border-border bg-surface/30 text-foreground';

              return (
                <Link
                  key={track.slug}
                  href={`/learn/${track.slug}`}
                  className="block group"
                >
                  <article className={`relative overflow-hidden p-7 rounded-2xl border ${colors} hover:border-foreground/30 transition-all`}>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{trackIcons[track.slug] || '○'}</span>
                          <div>
                            <h2 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                              {track.title}
                            </h2>
                            <div className="flex gap-3 mt-1">
                              <span className="text-xs text-muted">{unitCount} units</span>
                              <span className="text-xs text-muted">·</span>
                              <span className="text-xs text-muted">{lessonCount} lessons</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted leading-relaxed mb-5 max-w-xl">
                        {track.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-medium text-accent">
                        <span>Start learning</span>
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
