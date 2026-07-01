import { KnowledgeBaseContentPage } from "@/components/console/knowledge-base-content-page";

export default async function ConsoleKnowledgeContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KnowledgeBaseContentPage id={id} />;
}
