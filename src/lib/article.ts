import type { PostMeta } from '@/lib/content';

export interface Heading {
  level: 2 | 3;
  text: string;
  id: string;
}

export interface RelatedPost extends PostMeta {
  overlapCount: number;
  sharedTags: string[];
}

/**
 * Extract h2/h3 headings from MDX content.
 * Skips headings inside code blocks, removes markdown formatting.
 */
export function extractHeadings(content: string): Heading[] {
  if (!content) return [];

  const headings: Heading[] = [];
  const idCounts = new Map<string, number>();
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (!match) continue;

    const level = match[1].length as 2 | 3;
    let text = match[2]
      .replace(/\*\*(.+?)\*\*/g, '$1') // bold
      .replace(/`(.+?)`/g, '$1')       // inline code
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
      .trim();

    // Generate unique slug ID
    let id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!id) id = 'heading';
    const count = idCounts.get(id) || 0;
    if (count > 0) id = `${id}-${count}`;
    idCounts.set(id.replace(/-\d+$/, '') || id, count + 1);

    headings.push({ level, text, id });
  }

  return headings;
}

/**
 * Find related posts by shared tags, sorted by overlap (descending).
 * Excludes the current post. Limited to `max` results (default 4).
 */
export function getRelatedPosts(
  currentSlug: string,
  allPosts: PostMeta[],
  max = 4,
): RelatedPost[] {
  const current = allPosts.find((p) => p.slug === currentSlug);
  if (!current) return [];

  const currentTags = current.tags.map((t) => t.toLowerCase());

  const scored = allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => {
      const postTags = p.tags.map((t) => t.toLowerCase());
      const shared = currentTags.filter((t) => postTags.includes(t));
      return { ...p, overlapCount: shared.length, sharedTags: shared } as RelatedPost;
    })
    .filter((p) => p.overlapCount > 0)
    .sort((a, b) => b.overlapCount - a.overlapCount);

  return scored.slice(0, max);
}
