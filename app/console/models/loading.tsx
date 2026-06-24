import { ConsolePageLoading } from "@/components/console/console-page-loading";

export default function ConsoleModelsLoading() {
  return (
    <ConsolePageLoading
      title="Model management"
      description="Configure providers, model names, and API keys. Only tested models can be used in chat."
      label="Loading models…"
    />
  );
}
