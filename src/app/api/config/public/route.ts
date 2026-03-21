import { getAppConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 供对话页等客户端读取的非敏感配置（不含日志开关） */
export async function GET() {
  const c = getAppConfig();
  return Response.json({
    maxMessagesInContext: c.maxMessagesInContext,
    defaultProvider: c.defaultProvider,
    defaultModel: c.defaultModel,
    appDisplayName: c.appDisplayName,
  });
}
