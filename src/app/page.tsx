export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { getCategories, getDailyTechPosts, getDailyFinancePosts } from '@/lib/content';

const categoryIcons: Record<string, string> = {
  'quant-theory': '📐',
  'quant-project': '📊',
  swe: '💻',
};

export default function Home() {
  const categories = getCategories();
  const dailyTechPosts = getDailyTechPosts();
  const dailyFinancePosts = getDailyFinancePosts();
  const latestTech = dailyTechPosts[0] ?? null;
  const recentTech = dailyTechPosts.slice(1, 4);
  const latestFinance = dailyFinancePosts[0] ?? null;
  const recentFinance = dailyFinancePosts.slice(1, 4);

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
          {latestTech && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                  <span>🧠</span> Daily Tech
                </h2>
                <Link href="/daily" className="text-xs text-accent hover:text-accent/80 transition-colors">
                  View all →
                </Link>
              </div>
              <Link href={`/${latestTech.slug}`} className="block group mb-3">
                <article className="p-5 rounded-xl border border-accent/20 bg-surface/50 hover:bg-surface hover:border-accent/50 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                      {latestTech.title}
                    </h3>
                    <span className="text-xs text-muted whitespace-nowrap mt-1 shrink-0">
                      {new Date(latestTech.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-3 leading-relaxed">{latestTech.description}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {latestTech.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-tag-bg text-tag-text">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
              {recentTech.length > 0 && (
                <div className="space-y-1">
                  {recentTech.map((post) => (
                    <Link key={post.slug} href={`/${post.slug}`} className="block group">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/60 transition-all">
                        <span className="text-xs text-muted whitespace-nowrap w-14 shrink-0">
                          {new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

          {/* Daily Finance — featured hero */}
          {latestFinance && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
                  <span>💰</span> Daily Finance
                </h2>
                <Link href="/daily-finance" className="text-xs text-accent hover:text-accent/80 transition-colors">
                  View all →
                </Link>
              </div>
              <Link href={`/${latestFinance.slug}`} className="block group mb-3">
                <article className="p-5 rounded-xl border border-accent/20 bg-surface/50 hover:bg-surface hover:border-accent/50 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                      {latestFinance.title}
                    </h3>
                    <span className="text-xs text-muted whitespace-nowrap mt-1 shrink-0">
                      {new Date(latestFinance.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-muted mb-3 leading-relaxed">{latestFinance.description}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {latestFinance.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-tag-bg text-tag-text">
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
              {recentFinance.length > 0 && (
                <div className="space-y-1">
                  {recentFinance.map((post) => (
                    <Link key={post.slug} href={`/${post.slug}`} className="block group">
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface/60 transition-all">
                        <span className="text-xs text-muted whitespace-nowrap w-14 shrink-0">
                          {new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
