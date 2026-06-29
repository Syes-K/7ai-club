"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
  /** Applied to rendered `<a>` tags; overrides default link color. */
  linkClassName?: string;
}

export function MarkdownContent({
  content,
  className,
  linkClassName,
}: MarkdownContentProps) {
  if (!content.trim()) {
    return <span>&nbsp;</span>;
  }

  return (
    <div className={cn("markdown-body text-sm leading-relaxed", className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "cursor-pointer underline hover:opacity-90",
                linkClassName ?? "text-[var(--neon-primary)]",
              )}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
