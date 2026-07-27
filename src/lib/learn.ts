import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { cache } from 'react';

// ── Types ──────────────────────────────────────────

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LessonMeta {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  prerequisites: string[];
  tags: string[];
  date: string;
  readingTime: number;
  unit: string;
  track: string;
}

export interface UnitMeta {
  slug: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonMeta[];
  track: string;
}

export interface TrackMeta {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
  units: UnitMeta[];
}

// ── Paths ──────────────────────────────────────────

const learnDir = path.join(process.cwd(), 'content', 'learn');

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

// ── Track loader ───────────────────────────────────

function loadTrack(trackSlug: string): TrackMeta | null {
  const trackDir = path.join(learnDir, trackSlug);
  const trackMeta = readJson<{
    title: string;
    description: string;
    icon: string;
    color?: string;
    units: string[];
  }>(path.join(trackDir, '_track.json'));
  if (!trackMeta) return null;

  const units: UnitMeta[] = [];

  for (const unitSlug of trackMeta.units) {
    const unitDir = path.join(trackDir, unitSlug);
    const unitMeta = readJson<{
      title: string;
      description: string;
      order: number;
      lessons: string[];
    }>(path.join(unitDir, '_unit.json'));
    if (!unitMeta) continue;

    const lessons: LessonMeta[] = [];

    for (const lessonFile of unitMeta.lessons) {
      const mdxPath = path.join(unitDir, `${lessonFile}.mdx`);
      if (!fs.existsSync(mdxPath)) continue;

      const raw = fs.readFileSync(mdxPath, 'utf-8');
      const { data, content } = matter(raw);

      // Estimate reading time
      const text = content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/\$\$[\s\S]*?\$\$/g, '')
        .replace(/\$[^$]+\$/g, '')
        .replace(/[#*_\[\]()>~]/g, '')
        .trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const readingTime = Math.max(1, Math.round(wordCount / 200));

      lessons.push({
        slug: lessonFile,
        title: data.title || lessonFile,
        description: data.description || '',
        difficulty: data.difficulty || 'beginner',
        order: data.order || 999,
        prerequisites: data.prerequisites || [],
        tags: data.tags || [],
        date: data.date || '',
        readingTime,
        unit: unitSlug,
        track: trackSlug,
      });
    }

    lessons.sort((a, b) => a.order - b.order);

    units.push({
      slug: unitSlug,
      title: unitMeta.title,
      description: unitMeta.description,
      order: unitMeta.order,
      lessons,
      track: trackSlug,
    });
  }

  units.sort((a, b) => a.order - b.order);

  return {
    slug: trackSlug,
    title: trackMeta.title,
    description: trackMeta.description,
    icon: trackMeta.icon,
    color: trackMeta.color,
    units,
  };
}

// ── Cached exports ─────────────────────────────────

export const getTracks = cache((): TrackMeta[] => {
  if (!fs.existsSync(learnDir)) return [];

  const entries = fs.readdirSync(learnDir, { withFileTypes: true });
  const tracks: TrackMeta[] = [];

  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== 'shared') {
      const track = loadTrack(entry.name);
      if (track) tracks.push(track);
    }
  }

  return tracks;
});

export const getTrack = cache((slug: string): TrackMeta | null => {
  return loadTrack(slug);
});

export const getLesson = cache(
  (trackSlug: string, unitSlug: string, lessonSlug: string): { meta: LessonMeta; content: string } | null => {
    const mdxPath = path.join(learnDir, trackSlug, unitSlug, `${lessonSlug}.mdx`);
    if (!fs.existsSync(mdxPath)) return null;

    const raw = fs.readFileSync(mdxPath, 'utf-8');
    const { data, content } = matter(raw);

    const text = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$[^$]+\$/g, '')
      .replace(/[#*_\[\]()>~]/g, '')
      .trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    return {
      meta: {
        slug: lessonSlug,
        title: data.title || lessonSlug,
        description: data.description || '',
        difficulty: data.difficulty || 'beginner',
        order: data.order || 999,
        prerequisites: data.prerequisites || [],
        tags: data.tags || [],
        date: data.date || '',
        readingTime,
        unit: unitSlug,
        track: trackSlug,
      },
      content,
    };
  }
);

/** Get total lesson count across all tracks */
export const getTotalLessonCount = cache((): number => {
  const tracks = getTracks();
  return tracks.reduce((sum, t) => {
    return sum + t.units.reduce((s, u) => s + u.lessons.length, 0);
  }, 0);
});
