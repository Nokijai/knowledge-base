export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import CodeBlock from '@/components/article/CodeBlock';
import Toc from '@/components/article/Toc';
import Callout from '@/components/learn/Callout';
import ProgressBar from '@/components/learn/ProgressBar';
import LessonNavigation from '@/components/learn/LessonNavigation';
import { getLesson, getTrack } from '@/lib/learn';
import { getCategories } from '@/lib/content';
import { extractHeadings } from '@/lib/article';
import rehypeHeadingLinks from '@/lib/rehype-heading-links';

interface Props {
  params: Promise<{ track: string; unit: string; lesson: string }>;
}

const mdxComponents = {
  CodeBlock,
  Callout,
  Tip: (props: any) => <Callout type="tip" {...props} />,
  Warning: (props: any) => <Callout type="warning" {...props} />,
  Info: (props: any) => <Callout type="info" {...props} />,
  Exercise: (props: any) => <Callout type="exercise" title="Exercise" {...props} />,
};

const difficultyColors: Record<string, string> = {
  beginner: 'border-green-500/30 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.08)]',
  intermediate: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.08)]',
  advanced: 'border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.08)]',
};

const difficultyLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const trackMeta: Record<string, { icon: string; accent: string }> = {
  swe: { icon: '◈', accent: 'accent-[#5e6ad2]' },
  quant: { icon: '◆', accent: 'accent-[#f59e0b]' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track: trackSlug, unit: unitSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(trackSlug, unitSlug, lessonSlug);
  if (!lesson) return { title: 'Lesson not found' };
  return {
    title: `${lesson.meta.title} — Learn`,
    description: lesson.meta.description,
  };
}

export default async function LessonPage({ params }: Props) {
  const { track: trackSlug, unit: unitSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(trackSlug, unitSlug, lessonSlug);
  const track = getTrack(trackSlug);
  const categories = getCategories();
  const mobileCategories = categories.map((c) => ({
    category: c.name,
    label: c.label,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  if (!lesson || !track) {
    notFound();
  }

  const allLessons = track.units.flatMap((u) => u.lessons);
  const currentIdx = allLessons.findIndex((l) => l.slug === lessonSlug);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const unit = track.units.find((u) => u.slug === unitSlug);
  const unitIdx = track.units.findIndex((u) => u.slug === unitSlug);
  const lessonInUnit = unit?.lessons.findIndex((l) => l.slug === lessonSlug) ?? 0;

  const meta = trackMeta[trackSlug] || { icon: '○', accent: 'accent' };
  const headings = extractHeadings(lesson.content);

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
            <Link href={`/learn/${trackSlug}`} className="hover:text-foreground transition-colors">
              {track.title}
            </Link>
            <span className="text-muted/40">/</span>
            <span className="text-foreground truncate max-w-[200px]">{lesson.meta.title}</span>
          </nav>

          {/* Progress indicator */}
          <div className="mb-8">
            <ProgressBar current={currentIdx + 1} total={allLessons.length} />
          </div>

          {/* Article header */}
          <header className="mb-10">
            {/* Meta row */}
            <div className="flex items-center gap-2 text-[11px] text-muted uppercase tracking-wider mb-3">
              <span>{meta.icon} {track.title}</span>
              <span className="text-muted/30">·</span>
              <span>Unit {unitIdx + 1}: {unit?.title}</span>
              <span className="text-muted/30">·</span>
              <span>Lesson {lessonInUnit + 1}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
              {lesson.meta.title}
            </h1>

            {/* Description */}
            <p className="text-base text-muted leading-relaxed mb-4">
              {lesson.meta.description}
            </p>

            {/* Tags & badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${difficultyColors[lesson.meta.difficulty] || difficultyColors.beginner}`}>
                {difficultyLabels[lesson.meta.difficulty] || 'Beginner'}
              </span>
              <span className="text-xs text-muted flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {lesson.meta.readingTime} min
              </span>
              {lesson.meta.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-tag-bg text-tag-text tracking-wide">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Prerequisites */}
            {lesson.meta.prerequisites.length > 0 && (
              <div className="mt-5 p-4 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-accent font-semibold mb-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Prerequisites
                </div>
                <div className="flex gap-2 flex-wrap">
                  {lesson.meta.prerequisites.map((preq) => {
                    const preqLesson = allLessons.find((l) => l.slug === preq);
                    return (
                      <Link
                        key={preq}
                        href={`/learn/${trackSlug}/${preqLesson?.unit || unitSlug}/${preq}`}
                        className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                      >
                        <span>←</span>
                        {preqLesson?.title || preq}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </header>

          {/* Content area */}
          <article className="
            prose prose-invert prose-sm max-w-none
            prose-headings:text-foreground
            prose-headings:font-bold
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/60
            prose-h3:text-base prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-sm prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-muted prose-p:leading-[1.75] prose-p:mb-4
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-a:transition-all
            prose-strong:text-foreground prose-strong:font-semibold
            prose-code:text-accent prose-code:text-[13px] prose-code:bg-accent/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-normal
            prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-pre:rounded-xl prose-pre:shadow-sm
            prose-pre:p-4 prose-pre:text-sm
            prose-blockquote:border-l-2 prose-blockquote:border-accent/50 prose-blockquote:text-muted prose-blockquote:bg-accent/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-xl
            prose-blockquote:not-italic
            prose-li:text-muted prose-li:leading-relaxed
            prose-ol:pl-5 prose-ul:pl-5
            prose-hr:border-border prose-hr:my-10
            prose-img:rounded-xl prose-img:border prose-img:border-border
            prose-table:text-sm prose-table:border-collapse
            prose-th:text-foreground prose-th:border prose-th:border-border prose-th:bg-surface/80 prose-th:px-3 prose-th:py-2 prose-th:font-semibold
            prose-td:text-muted prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
          ">
            <MDXRemote
              source={lesson.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkMath],
                  rehypePlugins: [rehypeKatex, rehypeHeadingLinks],
                },
              }}
              components={mdxComponents}
            />
          </article>

          {/* Navigation footer */}
          <LessonNavigation
            trackSlug={trackSlug}
            prevLesson={prevLesson}
            nextLesson={nextLesson}
          />
        </div>
      </main>
      {headings.length > 0 && <Toc headings={headings} />}
    </>
  );
}
