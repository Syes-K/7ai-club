import { AssistantFormClient } from "@/components/console/assistants/AssistantFormClient";

export const dynamic = "force-dynamic";

export default async function ConsoleAssistantEditPage({
  params,
}: {
  params: Promise<{ assistantId: string }>;
}) {
  const { assistantId } = await params;
  return (
    <div className="min-h-full flex-1">
      <AssistantFormClient mode="edit" assistantId={assistantId} />
    </div>
  );
}
