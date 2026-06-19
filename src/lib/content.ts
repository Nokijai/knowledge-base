import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';

export interface PostMeta {
  title: string;
  category: string;
  order: number;
  date: string;
  tags: string[];
  description: string;
  slug: string;
  readingTime: number; // minutes
}

export interface Post extends PostMeta {
  content: string;
}

const contentDir = path.join(process.cwd(), 'content');

function getAllMdxFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath));
    } else if (entry.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function estimateReadingTime(content: string): number {
  // Strip MDX/markdown syntax, count words, assume 200 wpm
  const text = content
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]+`/g, '')        // inline code
    .replace(/\$\$[\s\S]*?\$\$/g, '') // display math
    .replace(/\$[^$]+\$/g, '')      // inline math
    .replace(/[#*_\[\]()>~]/g, '')  // markdown symbols
    .trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const getAllPosts = cache((): PostMeta[] => {
  const files = getAllMdxFiles(contentDir);
  const posts = files
    .filter((f) => !path.basename(f).startsWith('.'))
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      const slug = path.basename(filePath, '.mdx');
      const readingTime = estimateReadingTime(content);
      return { ...data, slug, readingTime } as PostMeta;
    });
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

export const getPostBySlug = cache((slug: string): Post | null => {
  const files = getAllMdxFiles(contentDir);
  const filePath = files.find((f) => path.basename(f, '.mdx') === slug);
  if (!filePath) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const readingTime = estimateReadingTime(content);
  return { ...data, slug, content, readingTime } as Post;
});

export const getDailyTechPosts = cache((): PostMeta[] => {
  return getAllPosts()
    .filter((p) => p.category === 'daily-tech')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

export const getPostsByCategory = cache((category: string): PostMeta[] => {
  return getAllPosts()
    .filter((p) => p.category === category)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

/** Labels for rendering */
export const CATEGORY_LABELS: Record<string, string> = {
  'quant-theory': 'Theory',
  'quant-project': 'Projects',
  'swe': 'SWE',
  'daily-tech': 'Daily Tech',
};

export const CATEGORY_ICONS: Record<string, string> = {
  'quant-theory': '📐',
  'quant-project': '📊',
  'swe': '💻',
  'daily-tech': '🧠',
};

const CATEGORY_ORDER = ['quant-project', 'quant-theory', 'swe'];

export function getCategories(): { name: string; label: string; posts: PostMeta[] }[] {
  const posts = getAllPosts();
  const catMap = new Map<string, PostMeta[]>();
  for (const p of posts) {
    if (p.category === 'daily-tech') continue;
    if (!catMap.has(p.category)) catMap.set(p.category, []);
    catMap.get(p.category)!.push(p);
  }

  return CATEGORY_ORDER
    .filter((name) => catMap.has(name))
    .concat([...catMap.keys()].filter((k) => !CATEGORY_ORDER.includes(k)))
    .map((name) => ({
      name,
      label: CATEGORY_LABELS[name] || name,
      posts: (catMap.get(name) || []).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }));
}

/** Groups daily posts into: Today / This Week / This Month / Earlier */
export function groupDailyPostsByRecency(posts: PostMeta[]): {
  label: string;
  posts: PostMeta[];
}[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets: Record<string, PostMeta[]> = {
    Today: [],
    'This Week': [],
    'This Month': [],
    Earlier: [],
  };

  for (const p of posts) {
    const d = new Date(p.date + 'T00:00:00');
    if (p.date === todayStr) {
      buckets['Today'].push(p);
    } else if (d >= startOfWeek) {
      buckets['This Week'].push(p);
    } else if (d >= startOfMonth) {
      buckets['This Month'].push(p);
    } else {
      buckets['Earlier'].push(p);
    }
  }

  return Object.entries(buckets)
    .filter(([, ps]) => ps.length > 0)
    .map(([label, ps]) => ({ label, posts: ps }));
}
