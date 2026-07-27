import { describe, it, expect } from 'vitest';
import { extractHeadings, getRelatedPosts } from '@/lib/article';
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
    title: 'QQQ-VOO Pairs',
    category: 'quant-project',
    order: 2,
    date: '2026-06-05',
    tags: ['etf', 'pairs-trading', 'qqq', 'voo'],
    description: 'Analysis of QQQ-VOO.',
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
    title: 'Sector ETF Scanner',
    category: 'quant-project',
    order: 3,
    date: '2026-06-15',
    tags: ['pairs-trading', 'sector-etf', 'cointegration'],
    description: 'ETF pairs scanner tool.',
    slug: 'sector-etf-pairs-scanner',
    readingTime: 5,
  },
];

describe('extractHeadings', () => {
  it('extracts h2 and h3 headings from markdown', () => {
    const md = `## Introduction\n\nSome text\n\n### Setup\n\nMore text\n\n## Results\n\nFinal`;
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({ level: 2, text: 'Introduction', id: 'introduction' });
    expect(headings[1]).toEqual({ level: 3, text: 'Setup', id: 'setup' });
    expect(headings[2]).toEqual({ level: 2, text: 'Results', id: 'results' });
  });

  it('skips code blocks', () => {
    const md = `## Intro\n\n\`\`\`\n## This is inside code\n\`\`\`\n\n## Real heading`;
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(2);
    expect(headings[0].text).toBe('Intro');
    expect(headings[1].text).toBe('Real heading');
  });

  it('handles empty content', () => {
    expect(extractHeadings('')).toHaveLength(0);
  });

  it('handles content with no headings', () => {
    expect(extractHeadings('Just a paragraph.')).toHaveLength(0);
  });

  it('generates unique IDs for duplicate headings', () => {
    const md = `## Overview\n\n## Overview\n\n## Overview`;
    const headings = extractHeadings(md);
    expect(headings[0].id).toBe('overview');
    expect(headings[1].id).not.toBe(headings[0].id);
    expect(headings[2].id).not.toBe(headings[0].id);
    expect(headings[2].id).not.toBe(headings[1].id);
  });

  it('removes markdown formatting from heading text', () => {
    const md = '## **Bold** and `code`';
    const headings = extractHeadings(md);
    expect(headings[0].text).toBe('Bold and code');
  });
});

describe('getRelatedPosts', () => {
  it('returns posts with overlapping tags sorted by overlap count', () => {
    const results = getRelatedPosts('cointegration-theory', mockPosts);
    expect(results.length).toBeGreaterThanOrEqual(2);
    // QQQ-VOO has pairs-trading overlap, Sector ETF has pairs-trading + cointegration
    expect(results[0].slug).toBe('sector-etf-pairs-scanner'); // 2 overlapping tags
    expect(results[1].slug).toBe('qqq-voo-pairs-analysis');   // 1 overlapping tag
  });

  it('excludes the current post', () => {
    const results = getRelatedPosts('cointegration-theory', mockPosts);
    const slugs = results.map((r) => r.slug);
    expect(slugs).not.toContain('cointegration-theory');
  });

  it('returns empty for posts with no overlapping tags', () => {
    const results = getRelatedPosts('speculative-decoding', mockPosts);
    expect(results).toHaveLength(0);
  });

  it('includes overlap count and shared tags', () => {
    const results = getRelatedPosts('cointegration-theory', mockPosts);
    expect(results[0].overlapCount).toBeGreaterThanOrEqual(1);
    expect(results[0].sharedTags.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty for non-existent slug', () => {
    const results = getRelatedPosts('nonexistent', mockPosts);
    expect(results).toHaveLength(0);
  });

  it('limits results to default of 4', () => {
    // Add more posts with shared tags
    const extra = Array.from({ length: 6 }, (_, i) => ({
      ...mockPosts[0],
      slug: `extra-${i}`,
      title: `Extra ${i}`,
      tags: ['cointegration', 'pairs-trading'],
    }));
    const results = getRelatedPosts('cointegration-theory', [...mockPosts, ...extra]);
    expect(results.length).toBeLessThanOrEqual(4);
  });

  it('handles empty posts array', () => {
    const results = getRelatedPosts('cointegration-theory', []);
    expect(results).toHaveLength(0);
  });
});
