import { LogViewerApp } from "@/components/console/LogViewerApp";
import { App } from "antd";

export const dynamic = "force-dynamic";

export default function ConsoleLogsPage() {
  return (
    <App>
      <LogViewerApp />
    </App>
  );
}
