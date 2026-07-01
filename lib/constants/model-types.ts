export const MODEL_TYPE_IDS = [
  "chat",
  "embedding",
  "image",
  "video",
  "audio",
  "moderation",
  "rerank",
] as const;

export type ModelTypeId = (typeof MODEL_TYPE_IDS)[number];

export const MODEL_TYPE_LABELS: Record<ModelTypeId, string> = {
  chat: "Chat",
  embedding: "Embedding",
  image: "Image",
  video: "Video",
  audio: "Audio",
  moderation: "Moderation",
  rerank: "Rerank",
};

export function isModelTypeId(value: string): value is ModelTypeId {
  return (MODEL_TYPE_IDS as readonly string[]).includes(value);
}

export function getModelTypeLabel(type: ModelTypeId): string {
  return MODEL_TYPE_LABELS[type];
}
