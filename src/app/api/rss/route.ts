/**
 * GET /api/rss
 *
 * RSS 2.0 feed for the knowledge base — all articles, newest first.
 * Allows subscribers to track new daily-tech and daily-finance posts.
 */

import { NextRequest } from "next/server";
import { getAllPosts } from "@/lib/content";

const SITE_URL = "https://knowledge-base.worldofnoki.com";
const SITE_TITLE = "Knowledge Base — Noki";
const SITE_DESC = "Quant finance and software engineering knowledge base";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  const posts = getAllPosts().slice(0, 50); // latest 50

  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/${p.slug}</guid>
      <description>${escapeXml(p.description)}</description>
      <pubDate>${new Date(p.date + "T00:00:00Z").toUTCString()}</pubDate>
      <category>${escapeXml(p.category)}</category>
      ${p.tags.map((t) => `      <category>${escapeXml(t)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=600",
    },
  });
}