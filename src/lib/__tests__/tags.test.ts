import { describe, it, expect } from 'vitest';
import { getAllTags, getPostsByTag } from '@/lib/tags';
import type { PostMeta } from '@/lib/content';

const mockPosts: PostMeta[] = [
  {
    title: 'Cointegration Theory',
    category: 'quant-theory',
    order: 1,
    date: '2026-06-01',
    tags: ['cointegration', 'pairs-trading', 'time-series'],
    description: 'Deep dive into cointegration.',
    slug: 'cointegration-theory',
    readingTime: 8,
  },
  {
    title: 'QQQ-VOO Pairs Analysis',
    category: 'quant-project',
    order: 2,
    date: '2026-06-05',
    tags: ['etf', 'pairs-trading', 'qqq', 'voo'],
    description: 'Analysis of QQQ-VOO pair.',
    slug: 'qqq-voo-pairs-analysis',
    readingTime: 12,
  },
  {
    title: 'Speculative Decoding',
    category: 'daily-tech',
    order: 1,
    date: '2026-06-20',
    tags: ['llm', 'inference', 'decoding'],
    description: 'Accelerate LLM inference.',
    slug: 'speculative-decoding',
    readingTime: 6,
  },
  {
    title: 'Fourier Residue Identity',
    category: 'daily-finance',
    order: 1,
    date: '2026-07-18',
    tags: ['options', 'fourier', 'pricing'],
    description: 'Option pricing with residue calculus.',
    slug: 'fourier-residue-identity',
    readingTime: 10,
  },
];

describe('getAllTags', () => {
  it('returns all unique tags sorted alphabetically', () => {
    const tags = getAllTags(mockPosts);
    expect(tags.map((t) => t.name)).toEqual([
      'cointegration',
      'decoding',
      'etf',
      'fourier',
      'inference',
      'llm',
      'options',
      'pairs-trading',
      'pricing',
      'qqq',
      'time-series',
      'voo',
    ]);
  });

  it('includes count for each tag', () => {
    const tags = getAllTags(mockPosts);
    const pairs = tags.find((t) => t.name === 'pairs-trading');
    expect(pairs).toBeDefined();
    expect(pairs!.count).toBe(2);
  });

  it('returns count of 1 for unique tags', () => {
    const tags = getAllTags(mockPosts);
    const fourier = tags.find((t) => t.name === 'fourier');
    expect(fourier).toBeDefined();
    expect(fourier!.count).toBe(1);
  });

  it('returns empty array for empty posts', () => {
    expect(getAllTags([])).toEqual([]);
  });

  it('handles posts with no tags', () => {
    const posts = [
      { ...mockPosts[0], tags: [] },
      { ...mockPosts[1], tags: [] },
    ];
    expect(getAllTags(posts)).toEqual([]);
  });

  it('handles mixed posts with and without tags', () => {
    const posts = [
      { ...mockPosts[0], tags: ['tag-a'] },
      { ...mockPosts[1], tags: [] },
      { ...mockPosts[2], tags: ['tag-b'] },
    ];
    const tags = getAllTags(posts);
    expect(tags).toHaveLength(2);
    expect(tags[0].name).toBe('tag-a');
    expect(tags[1].name).toBe('tag-b');
  });
});

describe('getPostsByTag', () => {
  it('returns posts with the given tag', () => {
    const results = getPostsByTag('pairs-trading', mockPosts);
    expect(results).toHaveLength(2);
    const slugs = results.map((r) => r.slug);
    expect(slugs).toContain('cointegration-theory');
    expect(slugs).toContain('qqq-voo-pairs-analysis');
  });

  it('returns single post for unique tag', () => {
    const results = getPostsByTag('llm', mockPosts);
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe('speculative-decoding');
  });

  it('returns empty array for non-existent tag', () => {
    const results = getPostsByTag('nonexistent', mockPosts);
    expect(results).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const lower = getPostsByTag('LLM', mockPosts);
    const upper = getPostsByTag('LLM', mockPosts);
    expect(lower).toHaveLength(upper.length);
    expect(lower[0].slug).toBe(upper[0].slug);
  });

  it('returns posts sorted by date descending', () => {
    const results = getPostsByTag('pairs-trading', mockPosts);
    for (let i = 1; i < results.length; i++) {
      expect(new Date(results[i - 1].date).getTime())
        .toBeGreaterThanOrEqual(new Date(results[i].date).getTime());
    }
  });

  it('returns empty array for empty posts', () => {
    expect(getPostsByTag('llm', [])).toHaveLength(0);
  });
});
