"use client";

import { useState } from "react";
import Link from "next/link";

interface NavItem {
  category: string;
  label: string;
  posts: { slug: string; title: string }[];
}

export default function MobileHeader({ categories }: { categories: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="fixed top-0 left-0 right-0 h-14 bg-surface/80 backdrop-blur-md border-b border-border z-40 flex items-center px-4">
        <Link href="/" className="font-bold text-foreground mr-auto">
          KB <span className="text-muted font-normal">/ noki</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 text-muted hover:text-foreground"
          aria-label="Menu"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-30 bg-background/95 pt-14 overflow-y-auto">
          <nav className="p-6 space-y-6">
            {categories.map((cat) => (
              <div key={cat.category}>
                <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
                  {cat.label}
                </h3>
                <ul className="space-y-1">
                  {cat.posts.map((post) => (
                    <li key={post.slug}>
                      <Link
                        href={`/${post.slug}`}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-2 rounded-md text-foreground hover:bg-border/40"
                      >
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
