'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { searchPosts } from '@/lib/search';
import type { PostMeta } from '@/lib/content';

interface SearchModalProps {
  posts: PostMeta[];
}

export default function SearchModal({ posts }: SearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Memoized search results (metadata-only — fast, sync)
  const results = useMemo(() => searchPosts(query, posts), [query, posts]);

  // ── Keyboard shortcut: Cmd+K / Ctrl+K to open ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  }, []);

  const handleResultClick = useCallback(
    (slug: string) => {
      setIsOpen(false);
      router.push(`/${slug}`);
    },
    [router],
  );

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      data-testid="search-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className="w-full max-w-xl mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <svg
            className="w-5 h-5 text-muted shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted outline-none text-sm"
            aria-label="Search articles"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-muted bg-background rounded border border-border">
            <span>ESC</span>
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <ul>
              {results.map((post) => (
                <li key={post.slug}>
                  <button
                    onClick={() => handleResultClick(post.slug)}
                    className="w-full text-left px-4 py-3 hover:bg-border/40 transition-colors border-b border-border/50 last:border-0 group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-0.5">
                      <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                        {post.title}
                      </span>
                      <span className="text-xs text-muted whitespace-nowrap shrink-0">
                        {post.readingTime} min
                      </span>
                    </div>
                    <p className="text-xs text-muted line-clamp-1 mb-1.5">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider text-muted/60 font-medium">
                        {post.category}
                      </span>
                      {post.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 text-[10px] rounded-full bg-tag-bg text-tag-text"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : hasQuery ? (
            <div className="flex flex-col items-center py-12 text-center">
              <svg
                className="w-8 h-8 text-muted/40 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-muted">No results found</p>
              <p className="text-xs text-muted/60 mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-accent-dim flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
              </div>
              <p className="text-sm text-foreground font-medium mb-1">
                Search {posts.length} articles
              </p>
              <p className="text-xs text-muted">
                Type to search by title, description, or tags
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
