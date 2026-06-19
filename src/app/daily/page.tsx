import Link from 'next/link';
import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { getDailyTechPosts, getCategories } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Daily Tech Concepts — Noki',
  description: 'Daily AI/ML, quant, and SWE concepts — one fresh idea every day.',
};

export default function DailyPage() {
  const posts = getDailyTechPosts();
  const categories = getCategories();
  const mobileCategories = categories.map((c) => ({
    category: c.name,
    label: c.label,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  // Group posts by month
  const grouped = posts.reduce<Record<string, typeof posts>>((acc, p) => {
    const month = p.date.slice(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(p);
    return acc;
  }, {});

  const months = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <>
      <Sidebar />
      <MobileHeader categories={mobileCategories} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16 max-lg:pt-20">
          <div className="mb-10">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-foreground">🧠 Daily Tech Concepts</h1>
              <span className="text-xs text-muted">{posts.length} concepts</span>
            </div>
            <p className="text-muted text-sm">
              One genuinely interesting AI/ML, quant, or SWE concept — dropped every day.
            </p>
          </div>

          {months.map((month) => (
            <section key={month} className="mb-10">
              <h2 className="text-xs uppercase tracking-wider text-muted font-semibold mb-4">
                {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="space-y-2">
                {grouped[month].map((post) => (
                  <Link key={post.slug} href={`/${post.slug}`} className="block group">
                    <article className="flex items-start gap-4 p-3 rounded-lg hover:bg-surface/60 border border-transparent hover:border-border transition-all">
                      <span className="text-xs text-muted whitespace-nowrap mt-0.5 w-16 shrink-0">
                        {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors mb-0.5">
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted line-clamp-1">{post.description}</p>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
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
            <p className="text-muted text-sm">No concepts published yet. Check back soon.</p>
          )}
        </div>
      </main>
    </>
  );
}
