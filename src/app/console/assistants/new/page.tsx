import { AssistantFormClient } from "@/components/console/assistants/AssistantFormClient";

export const dynamic = "force-dynamic";

export default function ConsoleAssistantNewPage() {
  return (
    <div className="min-h-full flex-1">
      <AssistantFormClient mode="new" />
    </div>
  );
}
