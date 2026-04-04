/**
 * Next.js instrumentation：Node 进程级错误处理委托给
 * `register-node-error-handlers`（含 process.on），本文件不直接引用 process，
 * 以减少 Edge Instrumentation 构建对 `process.on` 的告警。
 */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerNodeErrorHandlers } = await import(
    "@/lib/server/register-node-error-handlers"
  );
  registerNodeErrorHandlers();
}

/**
 * App Router 等服务端请求处理过程中抛出的错误（Next 15+）。
 */
export async function onRequestError(
  err: Error & { digest?: string },
  request: { path: string; method: string },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
    renderSource?: string;
    revalidateReason?: string;
    renderType?: string;
  }
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { logCommonErrorSync } = await import("@/lib/server/common-error-log");
  logCommonErrorSync(err, {
    source: "onRequestError",
    digest: err.digest,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
    renderType: context.renderType,
  });
}
