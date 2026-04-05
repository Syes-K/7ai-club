/** 助手实体（与 SQLite `assistants` 表对应） */
export type AssistantRow = {
  id: string;
  name: string;
  prompt: string;
  iconEmoji: string | null;
  knowledgeBaseIds: string[];
  /** 单条开场白（可为空） */
  openingMessage: string;
  createdAt: number;
  updatedAt: number;
};

/** 创建/更新时的请求体（API 与校验层共用） */
export type AssistantInput = {
  name: string;
  prompt: string;
  iconEmoji: string | null;
  knowledgeBaseIds: string[];
  openingMessage: string;
};

/** 列表接口（不含 prompt） */
export type AssistantListItem = {
  id: string;
  name: string;
  iconEmoji: string | null;
  knowledgeBaseIds: string[];
  hasOpeningMessage: boolean;
  updatedAt: number;
};

/** 对话侧公开列表（无 prompt） */
export type AssistantPublicItem = {
  id: string;
  name: string;
  iconEmoji: string | null;
  openingMessage: string;
};
