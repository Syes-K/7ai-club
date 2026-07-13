import type { AssistantDto } from "@/lib/data/types";

export type PlatformAssistantDto = AssistantDto & { enabled: boolean };

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  return text || `Request failed (${response.status})`;
}

export async function listAdminPlatformAssistants(): Promise<PlatformAssistantDto[]> {
  const response = await fetch("/api/admin/assistants");
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { assistants: PlatformAssistantDto[] };
  return data.assistants;
}

export async function createAdminPlatformAssistant(body: {
  icon: string | null;
  name: string;
  openingMessage: string | null;
  systemPrompt: string;
  enabled?: boolean;
}): Promise<PlatformAssistantDto> {
  const response = await fetch("/api/admin/assistants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as PlatformAssistantDto;
}

export async function updateAdminPlatformAssistant(
  id: string,
  body: {
    icon: string | null;
    name: string;
    openingMessage: string | null;
    systemPrompt: string;
    enabled?: boolean;
  },
): Promise<PlatformAssistantDto> {
  const response = await fetch(`/api/admin/assistants/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as PlatformAssistantDto;
}

export async function deleteAdminPlatformAssistant(id: string): Promise<void> {
  const response = await fetch(`/api/admin/assistants/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await readError(response));
}
