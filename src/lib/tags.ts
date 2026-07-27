import type { PostMeta } from '@/lib/content';

export interface TagWithCount {
  name: string;
  count: number;
}

/**
 * Get all unique tags from posts, sorted alphabetically, with post counts.
 */
export function getAllTags(posts: PostMeta[]): TagWithCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get posts that have a specific tag, sorted by date descending (newest first).
 * Case-insensitive matching.
 */
export function getPostsByTag(tag: string, posts: PostMeta[]): PostMeta[] {
  const lower = tag.toLowerCase();
  return posts
    .filter((p) => p.tags.some((t) => t.toLowerCase() === lower))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
