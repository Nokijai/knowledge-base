import Link from 'next/link';
import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { getAllPosts, getCategories } from '@/lib/content';
import { getAllTags } from '@/lib/tags';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tags — Noki KB',
  description: 'Browse articles by tag.',
};

export default function TagsPage() {
  const posts = getAllPosts();
  const tags = getAllTags(posts);
  const categories = getCategories();
  const mobileCategories = categories.map((c) => ({
    category: c.name,
    label: c.label,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  // Size buckets for visual hierarchy
  const maxCount = Math.max(...tags.map((t) => t.count), 1);

  return (
    <>
      <Sidebar />
      <MobileHeader categories={mobileCategories} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16 max-lg:pt-20">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Tags
            </h1>
            <p className="text-muted text-sm">
              {tags.length} tags across {posts.length} articles
            </p>
          </div>

          {tags.length === 0 ? (
            <p className="text-muted text-sm">No tags yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {tags.map(({ name, count }) => {
                // Scale: 0.75 → 1.25 based on frequency
                const scale = 0.75 + (count / maxCount) * 0.5;
                return (
                  <Link
                    key={name}
                    href={`/tags/${encodeURIComponent(name)}`}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border hover:border-accent/40 hover:bg-accent-dim/20 transition-all"
                    style={{ fontSize: `${0.75 + scale * 0.05}rem` }}
                  >
                    <span className="text-foreground group-hover:text-accent transition-colors">
                      {name}
                    </span>
                    <span className="text-xs text-muted/60 tabular-nums">
                      {count}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
