import { KnowledgeBasesClient } from "@/components/console/knowledge/KnowledgeBasesClient";

export const dynamic = "force-dynamic";

export default function ConsoleKnowledgePage() {
  return (
    <div className="min-h-full flex-1">
      <KnowledgeBasesClient />
    </div>
  );
}
