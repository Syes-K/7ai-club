import "server-only";

import { logCommonErrorSync } from "@/lib/server/common-error-log";

let registered = false;

/** 仅在 Node 运行时由 instrumentation 动态加载，避免 Edge 构建图解析 process.on */
export function registerNodeErrorHandlers(): void {
  if (registered) return;
  registered = true;

  process.on("uncaughtException", (err, origin) => {
    logCommonErrorSync(err, {
      source: "uncaughtException",
      origin: String(origin),
    });
  });

  process.on("unhandledRejection", (reason) => {
    logCommonErrorSync(reason, {
      source: "unhandledRejection",
    });
  });
}
