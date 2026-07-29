import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Not Found',
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="max-w-md text-center">
        <div className="text-6xl font-bold text-muted/20 mb-4">404</div>
        <h1 className="text-xl font-bold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-muted mb-8">
          This page doesn't exist — it may have been moved or the link might be broken.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/learn"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors"
          >
            Browse Learn
          </Link>
        </div>
      </div>
    </div>
  );
}