import Link from 'next/link';
import { getCategories, getDailyTechPosts } from '@/lib/content';

const categoryIcons: Record<string, string> = {
  'quant-theory': '📐',
  'quant-project': '📊',
  swe: '💻',
};

export default function Sidebar() {
  const categories = getCategories();
  const dailyPosts = getDailyTechPosts();
  const recentDaily = dailyPosts.slice(0, 5);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-surface/50 backdrop-blur-sm flex flex-col z-30 max-lg:hidden">
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
            KB
          </span>
          <span className="text-sm text-muted">/ noki</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Daily Tech section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
              <span>🧠</span> Daily Tech
            </h3>
            <Link href="/daily" className="text-xs text-accent hover:text-accent/80 transition-colors">
              all →
            </Link>
          </div>
          <ul className="space-y-0.5">
            {recentDaily.map((post) => {
              const isToday = post.date === today;
              return (
                <li key={post.slug}>
                  <Link
                    href={`/${post.slug}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-border/40 transition-all group"
                  >
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 animate-pulse" />
                    )}
                    <span className="text-sm text-muted group-hover:text-foreground transition-colors truncate flex-1">
                      {post.title}
                    </span>
                    <span className="text-xs text-muted/60 shrink-0 whitespace-nowrap">
                      {new Date(post.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Other categories */}
        {categories.map((cat) => (
          <div key={cat.name}>
            <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2 flex items-center gap-1.5">
              <span>{categoryIcons[cat.name] || '📁'}</span>
              {cat.label}
            </h3>
            <ul className="space-y-0.5">
              {cat.posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/${post.slug}`}
                    className="block px-3 py-1.5 rounded-md text-sm text-muted hover:text-foreground hover:bg-border/40 transition-all"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <a
          href="https://github.com/Nokijai/Quant-and-SWE-knowledge-Base"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Source repo
        </a>
      </div>
    </aside>
  );
}
