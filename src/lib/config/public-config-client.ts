import type { ChatProviderId } from "@/lib/chat/types";

/** 与 `GET /api/config/public` 响应一致（客户端安全子集） */
export type PublicAppConfig = {
  maxMessagesInContext: number;
  defaultProvider: ChatProviderId;
  defaultModel: string;
  appDisplayName: string;
};

export async function fetchPublicAppConfig(): Promise<PublicAppConfig | null> {
  try {
    const res = await fetch("/api/config/public");
    if (!res.ok) return null;
    return (await res.json()) as PublicAppConfig;
  } catch {
    return null;
  }
}
