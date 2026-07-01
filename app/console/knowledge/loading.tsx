import { ConsolePageLoading } from "@/components/console/console-page-loading";

export default function ConsoleKnowledgeLoading() {
  return (
    <ConsolePageLoading
      title="Knowledge Base"
      description="Upload documents and bind knowledge to assistants."
      label="Loading knowledge bases…"
    />
  );
}
