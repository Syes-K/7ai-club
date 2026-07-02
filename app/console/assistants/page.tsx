import { AssistantsManager } from "@/components/console/assistants-manager";

interface ConsoleAssistantsPageProps {
  searchParams: Promise<{ create?: string }>;
}

export default async function ConsoleAssistantsPage({
  searchParams,
}: ConsoleAssistantsPageProps) {
  const { create } = await searchParams;

  return <AssistantsManager openCreateOnMount={create === "1"} />;
}
