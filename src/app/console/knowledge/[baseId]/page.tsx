import { KnowledgeBaseDetailClient } from "@/components/console/knowledge/KnowledgeBaseDetailClient";

export const dynamic = "force-dynamic";

export default async function ConsoleKnowledgeDetailPage({
  params,
}: {
  params: Promise<{ baseId: string }>;
}) {
  const { baseId } = await params;
  return (
    <div className="min-h-full flex-1">
      <KnowledgeBaseDetailClient baseId={baseId} />
    </div>
  );
}
