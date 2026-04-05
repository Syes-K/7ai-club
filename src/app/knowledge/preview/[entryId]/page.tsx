import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { KnowledgeDocumentPreviewClient } from "@/components/knowledge/KnowledgeDocumentPreviewClient";
import { getKnowledgeStore } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ entryId: string }>;
}): Promise<Metadata> {
  const { entryId } = await params;
  const entry = getKnowledgeStore().getEntry(entryId);
  if (!entry) {
    return { title: "文档不存在" };
  }
  const t = entry.title?.trim();
  return { title: t ? `${t} · 预览` : "文档预览" };
}

export default async function KnowledgeDocumentPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ entryId: string }>;
  searchParams: Promise<{ baseId?: string }>;
}) {
  const { entryId } = await params;
  const { baseId } = await searchParams;
  const entry = getKnowledgeStore().getEntry(entryId);
  if (!entry) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <KnowledgeDocumentPreviewClient
        entry={entry}
        backBaseId={typeof baseId === "string" ? baseId : undefined}
      />
    </div>
  );
}
