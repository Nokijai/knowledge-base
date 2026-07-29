import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ChatWidget from "@/components/chat/ChatWidget";
import SearchModal from "@/components/search/SearchModal";
import { getAllPosts, getCategories } from "@/lib/content";
import { getAllTags } from "@/lib/tags";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Knowledge Base — Noki",
    template: "%s — Noki KB",
  },
  description: "Quant finance and software engineering knowledge base",
  openGraph: {
    title: "Knowledge Base — Noki",
    description: "Quant finance and software engineering knowledge base",
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Knowledge Base — Noki",
    description: "Quant finance and software engineering knowledge base",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const posts = getAllPosts();
  const tags = getAllTags(posts);
  const totalReadingTime = posts.reduce((sum, p) => sum + p.readingTime, 0);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
        <SearchModal posts={posts} />
        <ChatWidget />

        {/* Footer stats — visible on desktop sidebar */}
        <footer className="max-lg:hidden fixed bottom-0 left-0 w-64 border-t border-border bg-surface/50 backdrop-blur-sm z-30 px-4 py-2">
          <div className="flex items-center justify-between text-[10px] text-muted/50">
            <span>{posts.length} articles</span>
            <span>{tags.length} tags</span>
            <span>{totalReadingTime}m total</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
