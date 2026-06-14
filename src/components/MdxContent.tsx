"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";

interface MdxContentProps {
  source: MDXRemoteSerializeResult;
}

export default function MdxContent({ source }: MdxContentProps) {
  return (
    <div className="prose">
      <MDXRemote {...source} />
    </div>
  );
}
