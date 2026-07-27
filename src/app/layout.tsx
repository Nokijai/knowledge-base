import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ChatWidget from "@/components/chat/ChatWidget";
import SearchModal from "@/components/search/SearchModal";
import { getAllPosts } from "@/lib/content";
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const posts = getAllPosts();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
        <SearchModal posts={posts} />
        <ChatWidget />
      </body>
    </html>
  );
}
