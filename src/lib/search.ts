import Fuse from 'fuse.js';
import type { PostMeta } from '@/lib/content';

export interface SearchResult extends PostMeta {
  score: number;
}

/**
 * Search posts by query using fuzzy matching (fuse.js).
 * Searches title, description, tags, and slug.
 * Returns results sorted by relevance (best match first).
 * Empty/whitespace queries return empty array.
 */
export function searchPosts(query: string, posts: PostMeta[]): SearchResult[] {
  const trimmed = query.trim();
  if (!trimmed || posts.length === 0) return [];

  const fuse = new Fuse(posts, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'description', weight: 1 },
      { name: 'tags', weight: 1.5 },
      { name: 'slug', weight: 1 },
    ],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const raw = fuse.search(trimmed);

  return raw.map(({ item, score }) => ({
    ...item,
    score: score !== undefined ? 1 - score : 0,
  }));
}
