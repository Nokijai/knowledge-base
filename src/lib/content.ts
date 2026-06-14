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

export const getAllPosts = cache((): PostMeta[] => {
  const files = getAllMdxFiles(contentDir);
  const posts = files.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);
    const slug = path.basename(filePath, '.mdx');
    return { ...data, slug } as PostMeta;
  });
  return posts.sort((a, b) => a.order - b.order);
});

export const getPostBySlug = cache((slug: string): Post | null => {
  const files = getAllMdxFiles(contentDir);
  const filePath = files.find((f) => path.basename(f, '.mdx') === slug);
  if (!filePath) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { ...data, slug, content } as Post;
});

export function getCategories(): { name: string; label: string; posts: PostMeta[] }[] {
  const posts = getAllPosts();
  const catMap = new Map<string, PostMeta[]>();
  for (const p of posts) {
    const cat = p.category;
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat)!.push(p);
  }
  const labels: Record<string, string> = {
    'quant-theory': 'Theory',
    'quant-project': 'Projects',
    'swe': 'SWE',
  };
  return Array.from(catMap.entries()).map(([name, posts]) => ({
    name,
    label: labels[name] || name,
    posts: posts.sort((a, b) => a.order - b.order),
  }));
}
