import { readAppConfigWithMeta } from "@/lib/config";
import { ConsoleConfigForm } from "@/components/console/ConsoleConfigForm";

export const dynamic = "force-dynamic";

export default function ConsolePage() {
  const { config, warning } = readAppConfigWithMeta();

  return (
    <div className="min-h-full flex-1">
      <ConsoleConfigForm
        initialConfig={config}
        initialFileWarning={warning}
      />
    </div>
  );
}
