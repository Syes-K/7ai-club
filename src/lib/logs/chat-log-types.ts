/** 行 JSON 解析后的记录（字段随事件变化） */
export type ChatLogRecord = Record<string, unknown>;

export const UNSET_LEVEL_SENTINEL = "__UNSET__";

export type ChatLogQuery = {
  /** 闭区间 [startMs, endMs]，与 ISO 解析一致 */
  startMs: number;
  endMs: number;
  /** 选中的 level；空数组表示不限。含 UNSET_LEVEL_SENTINEL 时匹配缺失/空 level */
  levels: string[];
  /** 多条为 OR */
  events: string[];
  /** 前缀匹配 requestId */
  requestIdPrefix: string;
  /** 不区分大小写，对整行 JSON 字符串化后子串匹配 */
  keyword: string;
  page: number;
  pageSize: number;
};

export type ChatLogQueryResult = {
  items: ChatLogRecord[];
  total: number;
  page: number;
  pageSize: number;
  /** 因扫描行数上限提前停止 */
  scanTruncated: boolean;
  scannedLines: number;
};

export type ChatLogFacets = {
  levels: string[];
  events: string[];
  scanTruncated: boolean;
  scannedLines: number;
};

export interface ChatLogRepository {
  query(q: ChatLogQuery): Promise<ChatLogQueryResult>;
  facets(range: { startMs: number; endMs: number }): Promise<ChatLogFacets>;
}
