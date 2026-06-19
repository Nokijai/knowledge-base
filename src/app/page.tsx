export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { getCategories, getDailyTechPosts } from '@/lib/content';

const categoryIcons: Record<string, string> = {
  'quant-theory': '📐',
  'quant-project': '📊',
  swe: '💻',
};

export default function Home() {
  const categories = getCategories();
  const dailyPosts = getDailyTechPosts();
  const latestDaily = dailyPosts[0] ?? null;
  const recentDaily = dailyPosts.slice(1, 4);

  const mobileCategories = categories.map((c) => ({
    category: c.name,
    label: c.label,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  return (
    <>
      <Sidebar />
      <MobileHeader categories={mobileCategories} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16 max-lg:pt-20">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-2">Knowledge Base</h1>
            <p className="text-muted">
              Quant finance & SWE — short notes, formulas, and project write-ups.
            </p>
          </div>

          {/* Daily Tech — featured hero */}
          {latestDaily && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                  <span>🧠</span> Daily Concept
                </h2>
                <Link
                  href="/daily"
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  View all →
                </Link>
              </div>

              {/* Hero card — latest */}
              <Link href={`/${latestDaily.slug}`} className="block group mb-3">
                <article className="p-5 rounded-xl border border-accent/20 bg-surface/50 hover:bg-surface hover:border-accent/50 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                      {latestDaily.title}
                    </h3>
                    <span className="text-xs text-muted whitespace-nowrap mt-1 shrink-0">
                      {new Date(latestDaily.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-3 leading-relaxed">{latestDaily.description}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {latestDaily.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-tag-bg text-tag-text">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>

              {/* Recent strip — previous 3 */}
              {recentDaily.length > 0 && (
                <div className="space-y-1">
                  {recentDaily.map((post) => (
                    <Link key={post.slug} href={`/${post.slug}`} className="block group">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/60 transition-all">
                        <span className="text-xs text-muted whitespace-nowrap w-14 shrink-0">
                          {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-sm text-muted group-hover:text-foreground transition-colors truncate">
                          {post.title}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Divider */}
          <div className="border-t border-border mb-10" />

          {/* Other category sections */}
          {categories.map((cat) => (
            <section key={cat.name} className="mb-10">
              <h2 className="text-xs uppercase tracking-wider text-muted font-semibold mb-4 flex items-center gap-1.5">
                <span>{categoryIcons[cat.name] || '📁'}</span>
                {cat.label}
              </h2>
              <div className="space-y-3">
                {cat.posts.map((post) => (
                  <Link key={post.slug} href={`/${post.slug}`} className="block group">
                    <article className="p-4 rounded-lg border border-border hover:border-accent/40 bg-surface/30 hover:bg-surface/60 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors mb-1">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted line-clamp-2">{post.description}</p>
                        </div>
                        <span className="text-xs text-muted whitespace-nowrap mt-1">{post.date}</span>
                      </div>
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {post.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-tag-bg text-tag-text">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
