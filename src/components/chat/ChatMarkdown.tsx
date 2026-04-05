"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

type Props = {
  /** 助手消息正文（Markdown） */
  children: string;
  className?: string;
};

const markdownComponents: Components = {
  a({ href, children }) {
    if (!href) {
      return <span>{children}</span>;
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

/**
 * 对话区助手气泡内 Markdown 渲染（GFM + HTML 消毒），样式复用 globals 中 `.kb-md-preview`。
 * 链接统一新标签页打开，便于查看知识库预览等而不离开对话。
 */
export function ChatMarkdown({ children, className = "" }: Props) {
  return (
    <article
      className={`kb-md-preview min-w-0 text-sm leading-relaxed ${className}`}
    >
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {children}
      </ReactMarkdown>
    </article>
  );
}
