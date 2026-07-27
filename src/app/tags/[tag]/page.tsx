import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { getAllPosts, getCategories } from '@/lib/content';
import { getPostsByTag } from '@/lib/tags';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${decodeURIComponent(tag)} — Tags — Noki KB`,
    description: `Articles tagged with "${decodeURIComponent(tag)}".`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const posts = getAllPosts();
  const matching = getPostsByTag(tag, posts);
  const categories = getCategories();
  const mobileCategories = categories.map((c) => ({
    category: c.name,
    label: c.label,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  if (matching.length === 0) {
    notFound();
  }

  return (
    <>
      <Sidebar />
      <MobileHeader categories={mobileCategories} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16 max-lg:pt-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/tags"
              className="hover:text-foreground transition-colors"
            >
              Tags
            </Link>
            <span>/</span>
            <span className="text-foreground/70">#{tag}</span>
          </nav>

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              <span className="text-accent">#</span>
              {tag}
            </h1>
            <p className="text-muted text-sm">
              {matching.length} article{matching.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Post list */}
          <div className="space-y-3">
            {matching.map((post) => (
              <Link
                key={post.slug}
                href={`/${post.slug}`}
                className="block group"
              >
                <article className="p-4 rounded-lg border border-border hover:border-accent/40 bg-surface/30 hover:bg-surface/60 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-1.5">
                    <h2 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    <span className="text-xs text-muted whitespace-nowrap shrink-0 mt-1">
                      {post.date}
                    </span>
                  </div>
                  <p className="text-sm text-muted line-clamp-2 mb-2">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted/60 uppercase tracking-wider">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted/40">·</span>
                    <span className="text-xs text-muted/60">
                      {post.readingTime} min read
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
