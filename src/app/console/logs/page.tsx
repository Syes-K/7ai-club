import { LogViewerApp } from "@/components/console/LogViewerApp";
import { App } from "antd";

export const dynamic = "force-dynamic";

/** 服务端与首次水合共用同一默认日历日，避免 dayjs() 在 SSR/CSR 边界不一致 */
function todayYmdServerLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ConsoleLogsPage() {
  const initialDateStr = todayYmdServerLocal();
  return (
    <App>
      <LogViewerApp initialDateStr={initialDateStr} />
    </App>
  );
}
