import { KnowledgeBaseChunksPage } from "@/components/console/knowledge-base-chunks-page";

export default async function ConsoleKnowledgeChunksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KnowledgeBaseChunksPage id={id} />;
}
