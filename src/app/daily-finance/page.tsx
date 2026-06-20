import Link from 'next/link';
import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { getDailyFinancePosts, getCategories, groupDailyPostsByRecency } from '@/lib/content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Daily Finance Concepts — Noki KB',
  description: 'Daily quant finance, macro, derivatives, and trading concepts — one idea every week.',
};

export default function DailyFinancePage() {
  const posts = getDailyFinancePosts();
  const categories = getCategories();
  const mobileCategories = categories.map((c) => ({
    category: c.name,
    label: c.label,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  const groups = groupDailyPostsByRecency(posts);

  return (
    <>
      <Sidebar />
      <MobileHeader categories={mobileCategories} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16 max-lg:pt-20">

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-foreground">💰 Daily Finance Concepts</h1>
              <span className="text-xs text-muted">{posts.length} total</span>
            </div>
            <p className="text-muted text-sm">
              Quant finance, macro, derivatives, and trading — one concept every Tue/Thu/Sat.
            </p>
          </div>

          {/* Recency-grouped list */}
          {groups.map(({ label, posts: groupPosts }) => (
            <section key={label} className="mb-10">
              <h2 className="text-xs uppercase tracking-wider text-muted font-semibold mb-4 flex items-center gap-2">
                {label === 'Today' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                {label}
              </h2>
              <div className="space-y-2">
                {groupPosts.map((post) => (
                  <Link key={post.slug} href={`/${post.slug}`} className="block group">
                    <article className="flex items-start gap-4 p-3 rounded-lg hover:bg-surface/60 border border-transparent hover:border-border transition-all">
                      <span className="text-xs text-muted whitespace-nowrap mt-0.5 w-14 shrink-0">
                        {new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors mb-0.5">
                            {post.title}
                          </h3>
                          <span className="text-xs text-muted whitespace-nowrap shrink-0 mt-0.5">
                            {post.readingTime} min
                          </span>
                        </div>
                        <p className="text-xs text-muted line-clamp-1 mb-1.5">{post.description}</p>
                        <div className="flex gap-1 flex-wrap">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 text-xs rounded-full bg-tag-bg text-tag-text">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">💰</p>
              <p className="text-muted text-sm">First concept drops Tuesday. Check back soon.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
