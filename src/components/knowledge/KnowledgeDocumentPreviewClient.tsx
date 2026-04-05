"use client";

import Link from "next/link";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { KnowledgeEntry } from "@/lib/knowledge/types";

type Props = {
  entry: KnowledgeEntry;
  /** 从控制台进入时带上，用于「返回知识库」 */
  backBaseId?: string | null;
};

export function KnowledgeDocumentPreviewClient({
  entry,
  backBaseId,
}: Props) {
  const backConsoleHref = useMemo(() => {
    const b = backBaseId?.trim();
    return b ? `/console/knowledge/${b}` : null;
  }, [backBaseId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm">
        {backConsoleHref ? (
          <Link
            href={backConsoleHref}
            className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
          >
            ← 返回知识库管理
          </Link>
        ) : (
          <>
            <Link
              href="/chat"
              className="text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
            >
              对话
            </Link>
            <span className="text-zinc-400">·</span>
            <Link
              href="/"
              className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              首页
            </Link>
          </>
        )}
      </div>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {entry.title?.trim() ? entry.title : "（无标题）"}
      </h1>
      <p className="mb-8 text-xs text-zinc-500 dark:text-zinc-400">
        Markdown 预览；内容与知识库中的文档一致。
      </p>

      <article className="kb-md-preview rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
        >
          {entry.body}
        </ReactMarkdown>
      </article>
    </div>
  );
}
