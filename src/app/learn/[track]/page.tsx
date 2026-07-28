export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import ProgressBar from '@/components/learn/ProgressBar';
import { getTrack } from '@/lib/learn';
import { getCategories } from '@/lib/content';

interface Props {
  params: Promise<{ track: string }>;
}

const trackMeta: Record<string, { icon: string; accent: string; color: string }> = {
  swe: { icon: '◈', accent: '#5e6ad2', color: 'from-[#5e6ad2]/20 via-[#5e6ad2]/5 to-transparent' },
  quant: { icon: '◆', accent: '#f59e0b', color: 'from-[#f59e0b]/20 via-[#f59e0b]/5 to-transparent' },
};

const difficultyColors: Record<string, string> = {
  beginner: 'text-green-400 bg-green-500/10 border-green-500/20',
  intermediate: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  advanced: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const difficultyLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track: trackSlug } = await params;
  const track = getTrack(trackSlug);
  if (!track) return { title: 'Track not found' };
  return {
    title: `${track.title} — Learn`,
    description: track.description,
  };
}

export default async function TrackPage({ params }: Props) {
  const { track: trackSlug } = await params;
  const track = getTrack(trackSlug);
  const categories = getCategories();
  const mobileCategories = categories.map((c) => ({
    category: c.name,
    label: c.label,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  if (!track) {
    notFound();
  }

  const totalLessons = track.units.reduce((s, u) => s + u.lessons.length, 0);
  const meta = trackMeta[trackSlug] || { icon: '○', accent: '#888', color: 'from-border/20 to-transparent' };

  return (
    <>
      <Sidebar />
      <MobileHeader categories={mobileCategories} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16 max-lg:pt-20">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted mb-6">
            <Link href="/learn" className="hover:text-foreground transition-colors">Learn</Link>
            <span className="text-muted/40">/</span>
            <span className="text-foreground">{track.title}</span>
          </nav>

          {/* Header card */}
          <div className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${meta.color} p-7 mb-10`}>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{meta.icon}</span>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{track.title}</h1>
                  <p className="text-sm text-muted mt-1">{track.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {track.units.length} units
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {totalLessons} lessons
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-8 px-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted font-medium">Course Progress</span>
              <span className="text-[10px] text-muted/60">0 / {totalLessons} completed</span>
            </div>
            <ProgressBar current={0} total={totalLessons} showLabel={false} />
          </div>

          {/* Units */}
          <div className="space-y-5">
            {track.units.map((unit, unitIdx) => (
              <section key={unit.slug} className="rounded-xl border border-border overflow-hidden bg-surface/20 hover:bg-surface/30 transition-colors">
                {/* Unit header */}
                <div className="px-5 py-4 border-b border-border bg-surface/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-muted font-semibold">
                      Unit {unit.order + 1}
                    </span>
                    <span className="text-[11px] text-muted">
                      {unit.lessons.filter(l => false).length}/{unit.lessons.length} · {unit.lessons.length} lessons
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-foreground">{unit.title}</h2>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{unit.description}</p>
                </div>

                {/* Lesson list */}
                <div className="divide-y divide-border/50">
                  {unit.lessons.map((lesson, lessonIdx) => (
                    <Link
                      key={lesson.slug}
                      href={`/learn/${track.slug}/${unit.slug}/${lesson.slug}`}
                      className="flex items-start gap-4 px-5 py-3.5 hover:bg-accent/5 transition-all group"
                    >
                      {/* Number badge */}
                      <div className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center shrink-0 mt-0.5 group-hover:border-accent/40 group-hover:bg-accent/10 transition-all">
                        <span className="text-xs font-mono font-bold text-muted group-hover:text-accent transition-colors">
                          {String(unitIdx + 1).padStart(2, '0')}.{String(lessonIdx + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                            {lesson.title}
                          </h3>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${difficultyColors[lesson.difficulty] || difficultyColors.beginner}`}>
                            {difficultyLabels[lesson.difficulty] || 'Beginner'}
                          </span>
                        </div>
                        <p className="text-xs text-muted/70 line-clamp-1">{lesson.description}</p>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 shrink-0 mt-1">
                        <div className="flex items-center gap-1 text-[11px] text-muted">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {lesson.readingTime}m
                        </div>
                        <svg className="w-4 h-4 text-muted/30 group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}

                  {unit.lessons.length === 0 && (
                    <div className="px-5 py-6 text-center">
                      <div className="text-2xl mb-2 opacity-30">○</div>
                      <p className="text-xs text-muted italic">Coming soon — lessons are being written.</p>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
