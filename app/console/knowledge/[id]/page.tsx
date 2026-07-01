import { KnowledgeBaseDetail } from "@/components/console/knowledge-base-detail";

export default async function ConsoleKnowledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KnowledgeBaseDetail id={id} />;
}
