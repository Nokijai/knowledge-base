import { describe, it, expect } from 'vitest';
import { searchPosts } from '@/lib/search';
import type { PostMeta } from '@/lib/content';

const mockPosts: PostMeta[] = [
  {
    title: 'Cointegration Theory in Pairs Trading',
    category: 'quant-theory',
    order: 1,
    date: '2026-06-01',
    tags: ['cointegration', 'pairs-trading', 'time-series'],
    description: 'A deep dive into cointegration theory and its application in statistical arbitrage.',
    slug: 'cointegration-theory',
    readingTime: 8,
  },
  {
    title: 'QQQ-VOO Pairs Analysis',
    category: 'quant-project',
    order: 2,
    date: '2026-06-05',
    tags: ['etf', 'pairs-trading', 'qqq', 'voo'],
    description: 'Empirical analysis of the QQQ-VOO pair: hedge ratio, spread, and trading signals.',
    slug: 'qqq-voo-pairs-analysis',
    readingTime: 12,
  },
  {
    title: 'Speculative Decoding for LLM Inference',
    category: 'daily-tech',
    order: 1,
    date: '2026-06-20',
    tags: ['llm', 'inference', 'decoding'],
    description: 'How speculative decoding accelerates LLM inference without quality loss.',
    slug: 'speculative-decoding',
    readingTime: 6,
  },
  {
    title: 'Fourier Residue Identity in Option Pricing',
    category: 'daily-finance',
    order: 1,
    date: '2026-07-18',
    tags: ['options', 'fourier', 'pricing'],
    description: 'A Fourier-based approach to computing option prices with residue calculus.',
    slug: 'fourier-residue-identity',
    readingTime: 10,
  },
];

describe('searchPosts', () => {
  it('returns empty array for empty query', () => {
    const results = searchPosts('', mockPosts);
    expect(results).toHaveLength(0);
  });

  it('returns empty array for whitespace-only query', () => {
    const results = searchPosts('   ', mockPosts);
    expect(results).toHaveLength(0);
  });

  it('finds posts by title keyword', () => {
    const results = searchPosts('cointegration', mockPosts);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].slug).toBe('cointegration-theory');
  });

  it('finds posts by description keyword', () => {
    const results = searchPosts('speculative', mockPosts);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].slug).toContain('speculative');
  });

  it('finds posts by tag', () => {
    const results = searchPosts('pairs-trading', mockPosts);
    expect(results.length).toBeGreaterThanOrEqual(2);
    const slugs = results.map((r) => r.slug);
    expect(slugs).toContain('cointegration-theory');
    expect(slugs).toContain('qqq-voo-pairs-analysis');
  });

  it('finds posts by partial/fuzzy match', () => {
    // 'fourier' should match the Fourier article
    const results = searchPosts('fourier', mockPosts);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].slug).toContain('fourier');
  });

  it('returns empty array when no posts match', () => {
    const results = searchPosts('xyznonexistentkeyword', mockPosts);
    expect(results).toHaveLength(0);
  });

  it('returns empty array when posts array is empty', () => {
    const results = searchPosts('cointegration', []);
    expect(results).toHaveLength(0);
  });

  it('sorts results by relevance (best match first)', () => {
    const results = searchPosts('pairs trading', mockPosts);
    expect(results.length).toBeGreaterThanOrEqual(2);
    // The top result should have a higher score than subsequent ones
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('handles case-insensitive matching', () => {
    const upper = searchPosts('COINTEGRATION', mockPosts);
    const lower = searchPosts('cointegration', mockPosts);
    expect(upper).toHaveLength(lower.length);
    expect(upper[0].slug).toBe(lower[0].slug);
  });

  it('handles multi-word queries', () => {
    const results = searchPosts('option pricing', mockPosts);
    expect(results.length).toBeGreaterThanOrEqual(1);
    const slugs = results.map((r) => r.slug);
    expect(slugs).toContain('fourier-residue-identity');
  });

  it('returns post metadata intact in results', () => {
    const results = searchPosts('cointegration', mockPosts);
    expect(results[0]).toMatchObject({
      slug: 'cointegration-theory',
      title: 'Cointegration Theory in Pairs Trading',
      category: 'quant-theory',
      readingTime: 8,
    });
    expect(typeof results[0].score).toBe('number');
  });
});
