import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { getAllPosts, getPostBySlug, getCategories } from "@/lib/content";
import {
  NormalizedPriceChart,
  RatioChart,
} from "@/components/charts/QqqVooCharts";
import { SpreadChart, ZScoreChart } from "@/components/charts/SectorEtfCharts";

const mdxComponents = {
  NormalizedPriceChart,
  RatioChart,
  SpreadChart,
  ZScoreChart,
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prev = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const next =
    currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const categories = getCategories();
  const mobileCategories = categories.map((c) => ({
    category: c.name,
    label: c.label,
    posts: c.posts.map((p) => ({ slug: p.slug, title: p.title })),
  }));

  const categoryLabels: Record<string, string> = {
    "quant-theory": "Theory",
    "quant-project": "Projects",
    swe: "SWE",
    "daily-tech": "Daily Tech",
  };

  return (
    <>
      <Sidebar />
      <MobileHeader categories={mobileCategories} />
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-16 max-lg:pt-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground/70">
              {categoryLabels[post.category] || post.category}
            </span>
          </nav>

          {/* Article header */}
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-3">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted">{post.date}</span>
              <div className="flex gap-1.5 flex-wrap">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs rounded-full bg-tag-bg text-tag-text"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="prose">
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkMath],
                  rehypePlugins: [rehypeKatex as any],
                },
              }}
              components={mdxComponents}
            />
          </div>

          {/* Prev / Next */}
          <nav className="mt-16 pt-6 border-t border-border flex justify-between gap-4">
            {prev ? (
              <Link href={`/${prev.slug}`} className="group flex flex-col">
                <span className="text-xs text-muted mb-1">← Previous</span>
                <span className="text-sm text-foreground group-hover:text-accent transition-colors">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/${next.slug}`}
                className="group flex flex-col text-right"
              >
                <span className="text-xs text-muted mb-1">Next →</span>
                <span className="text-sm text-foreground group-hover:text-accent transition-colors">
                  {next.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </div>
      </main>
    </>
  );
}
