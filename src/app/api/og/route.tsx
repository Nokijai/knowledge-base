/**
 * GET /api/og
 *
 * Dynamic Open Graph image for article pages.
 * Uses Next.js ImageResponse — generates a real PNG.
 */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPostBySlug } from "@/lib/content";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  let title = "Knowledge Base — Noki";
  let description = "Quant finance and software engineering knowledge base";

  if (slug) {
    const post = getPostBySlug(slug);
    if (post) {
      title = post.title;
      description = post.description;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #1e3a5f 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1a1a2e 0%, transparent 50%)",
          padding: "60px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: 28, color: "#3b82f6", fontWeight: 700 }}>
            KB
          </span>
          <span style={{ fontSize: 18, color: "#737373" }}>/ noki</span>
        </div>
        <h1
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#e5e5e5",
            margin: 0,
            marginBottom: 16,
            lineHeight: 1.2,
            maxWidth: "90%",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 24,
            color: "#737373",
            margin: 0,
            lineHeight: 1.4,
            maxWidth: "80%",
          }}
        >
          {description}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}