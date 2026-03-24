import { App } from "antd";
import { IntentRoutingConfigApp } from "@/components/console/IntentRoutingConfigApp";

export const dynamic = "force-dynamic";

export default function ConsoleIntentRoutingConfigPage() {
  return (
    <App>
      <IntentRoutingConfigApp />
    </App>
  );
}
