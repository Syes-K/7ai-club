import { AssistantsListClient } from "@/components/console/assistants/AssistantsListClient";

export const dynamic = "force-dynamic";

export default function ConsoleAssistantsPage() {
  return (
    <div className="min-h-full flex-1">
      <AssistantsListClient />
    </div>
  );
}
