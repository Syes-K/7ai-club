"use client";

import { useCallback, useEffect, useState } from "react";
import { MODEL_GROUPS } from "@/lib/provider/models";
import type { ChatProviderId } from "@/lib/provider/types";
import type { AppConfig } from "@/lib/config/defaults";
import { FALLBACK_DEFAULTS } from "@/lib/config/defaults";
import { Tooltip } from "antd";

type Props = {
  initialConfig: AppConfig;
  initialFileWarning: string | null;
};

export function ConsoleConfigForm({
  initialConfig,
  initialFileWarning,
}: Props) {
  const [cfg, setCfg] = useState<AppConfig>(() => ({ ...initialConfig }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileWarn] = useState<string | null>(initialFileWarning);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(false), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/console/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof j.error === "string" ? j.error : "保存失败");
        return;
      }
      setSuccess(true);
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }, [cfg]);

  const restore = useCallback(() => {
    if (
      !confirm(
        "确定将所有项恢复为内置默认值？未保存的修改将丢失。"
      )
    ) {
      return;
    }
    setCfg({ ...FALLBACK_DEFAULTS });
    setError(null);
    setSuccess(false);
  }, []);

  const cardClass =
    "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {fileWarn && (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
        >
          配置文件无法解析，已使用内置默认值。保存后将写入新文件。
        </div>
      )}

      {success && (
        <div
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"
          role="status"
        >
          已保存
        </div>
      )}

      {error && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className={`${cardClass} mb-6`}>
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          模型与上下文
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="max-messages"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              最大上下文消息条数
            </label>
            <input
              id="max-messages"
              type="number"
              min={1}
              max={200}
              value={cfg.maxMessagesInContext}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setCfg((c) => ({
                  ...c,
                  maxMessagesInContext: Number.isFinite(v)
                    ? Math.min(200, Math.max(1, v))
                    : c.maxMessagesInContext,
                }));
              }}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
            <p className="mt-1 text-xs text-zinc-500">
              参与模型调用的最近若干条完整对话（user/assistant）条数上限。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="intent-confidence-threshold"
                className="mb-1 flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                意图命中阈值
                <Tooltip title="用于判定“是否命中某个意图”（0~1）。适用场景：误命中较多时调高（如 0.7→0.8）；漏命中较多时调低（如 0.7→0.6）。影响：阈值越高进入知识库链路越保守；阈值越低进入知识库链路越积极。">
                  <span
                    aria-label="意图命中阈值说明"
                    className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-300 text-[10px] text-zinc-500 dark:border-zinc-600"
                  >
                    ?
                  </span>
                </Tooltip>
              </label>
              <input
                id="intent-confidence-threshold"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={cfg.intentConfidenceThreshold}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setCfg((c) => ({
                    ...c,
                    intentConfidenceThreshold: Number.isFinite(v)
                      ? Math.min(1, Math.max(0, v))
                      : c.intentConfidenceThreshold,
                  }));
                }}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label
                htmlFor="intent-search-topn"
                className="mb-1 flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                意图检索 TopN
                <Tooltip title="用于控制知识检索返回给模型的候选片段数量（TopN，建议 1~5，默认 3）。适用场景：回答信息不足时可增大（如 3→5）；回答噪声变多或成本上升时可减小（如 3→2）。影响：TopN 越大信息更全但噪声与 token 成本可能上升；TopN 越小信息更聚焦但可能漏掉关键片段。">
                  <span
                    aria-label="意图检索 TopN 说明"
                    className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-300 text-[10px] text-zinc-500 dark:border-zinc-600"
                  >
                    ?
                  </span>
                </Tooltip>
              </label>
              <input
                id="intent-search-topn"
                type="number"
                min={1}
                max={20}
                value={cfg.intentSearchTopN}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setCfg((c) => ({
                    ...c,
                    intentSearchTopN: Number.isFinite(v)
                      ? Math.min(20, Math.max(1, v))
                      : c.intentSearchTopN,
                  }));
                }}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label
                htmlFor="intent-score-threshold"
                className="mb-1 flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                意图检索分值阈值
                <Tooltip title="用于过滤低相关检索结果（仅保留 score 大于等于该阈值的片段，范围 -1~1）。适用场景：知识片段杂、相关性差时调高（如 0.5→0.6）；常出现“命中意图但检索为空”时可调低（如 0.5→0.4）。影响：阈值越高结果更干净但更易空检索；阈值越低召回更充分但可能混入弱相关内容。">
                  <span
                    aria-label="意图检索分值阈值说明"
                    className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-300 text-[10px] text-zinc-500 dark:border-zinc-600"
                  >
                    ?
                  </span>
                </Tooltip>
              </label>
              <input
                id="intent-score-threshold"
                type="number"
                min={-1}
                max={1}
                step={0.01}
                value={cfg.intentScoreThreshold}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setCfg((c) => ({
                    ...c,
                    intentScoreThreshold: Number.isFinite(v)
                      ? Math.min(1, Math.max(-1, v))
                      : c.intentScoreThreshold,
                  }));
                }}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="context-summary-enabled"
              type="checkbox"
              checked={cfg.contextSummaryEnabled}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  contextSummaryEnabled: e.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <label
              htmlFor="context-summary-enabled"
              className="text-sm text-zinc-700 dark:text-zinc-300"
            >
              启用上下文摘要（长对话时压缩窗口外历史）
            </label>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            默认关闭。勾选后须点击页面底部「保存」才会写入配置；未启用时日志里{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              contextSummaryEnabled
            </code>{" "}
            为 false，不会产生摘要调用与{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              context_summary.*
            </code>{" "}
            日志。对话列表仍显示全部历史；摘要仅影响发往模型的上下文。
          </p>

          <div>
            <label
              htmlFor="context-summary-max-chars"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              摘要最大字符数
            </label>
            <input
              id="context-summary-max-chars"
              type="number"
              min={200}
              max={8000}
              value={cfg.contextSummaryMaxChars}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setCfg((c) => ({
                  ...c,
                  contextSummaryMaxChars: Number.isFinite(v)
                    ? Math.min(8000, Math.max(200, v))
                    : c.contextSummaryMaxChars,
                }));
              }}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
            <p className="mt-1 text-xs text-zinc-500">写入模型前截断（200～8000）</p>
          </div>

          <div>
            <label
              htmlFor="context-summary-refresh-every"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              摘要更新间隔（条）
            </label>
            <input
              id="context-summary-refresh-every"
              type="number"
              min={1}
              max={200}
              value={cfg.contextSummaryRefreshEvery}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setCfg((c) => ({
                  ...c,
                  contextSummaryRefreshEvery: Number.isFinite(v)
                    ? Math.min(200, Math.max(1, v))
                    : c.contextSummaryRefreshEvery,
                }));
              }}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
            <p className="mt-1 text-xs text-zinc-500">
              自上次成功摘要以来，持久化消息至少增加多少条再刷新；数值越大调用越少、摘要越可能滞后。
            </p>
          </div>

          <div>
            <label
              htmlFor="default-provider"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              默认厂商
            </label>
            <select
              id="default-provider"
              value={cfg.defaultProvider}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  defaultProvider: e.target.value as ChatProviderId,
                }))
              }
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              <option value="zhipu">智谱 GLM</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="default-zhipu-model"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              默认智谱模型
            </label>
            <select
              id="default-zhipu-model"
              value={cfg.defaultModel}
              onChange={(e) =>
                setCfg((c) => ({ ...c, defaultModel: e.target.value }))
              }
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              {MODEL_GROUPS.map((g) => (
                <optgroup key={g.label} label={`智谱 · ${g.label}`}>
                  {g.models.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} — {opt.hint}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {cfg.defaultProvider === "deepseek" && (
              <p className="mt-1 text-xs text-zinc-500">
                当前默认厂商为 DeepSeek；此处为切换到智谱时使用的默认型号。DeepSeek
                请求固定使用 <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">deepseek-chat</code>。
              </p>
            )}
          </div>

          <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              知识库 Embedding（可选）
            </h3>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
              与「默认智谱模型」同属应用配置，写入{" "}
              <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
                app-config.json
              </code>
              。留空则使用环境变量{" "}
              <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
                KNOWLEDGE_EMBEDDING_BASE_URL
              </code>{" "}
              /{" "}
              <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
                KNOWLEDGE_EMBEDDING_MODEL
              </code>
              ；环境变量**优先**于下方两项。API Key 仍只认{" "}
              <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
                KNOWLEDGE_EMBEDDING_API_KEY
              </code>
              。
            </p>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="embedding-api-base-url"
                  className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Embedding API 根 URL
                </label>
                <input
                  id="embedding-api-base-url"
                  type="url"
                  placeholder="https://api.openai.com/v1"
                  value={cfg.embeddingApiBaseUrl ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCfg((c) => ({
                      ...c,
                      embeddingApiBaseUrl: v === "" ? null : v,
                    }));
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  OpenAI 兼容接口根路径，请求会拼接 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/embeddings</code>
                </p>
              </div>
              <div>
                <label
                  htmlFor="embedding-model"
                  className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Embedding 模型 id
                </label>
                <input
                  id="embedding-model"
                  type="text"
                  placeholder="text-embedding-3-small"
                  value={cfg.embeddingModel ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCfg((c) => ({
                      ...c,
                      embeddingModel: v === "" ? null : v,
                    }));
                  }}
                  className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950"
                />
              </div>
            </div>

            <div className="border-t border-zinc-200 mt-6 pt-4 dark:border-zinc-700">
              <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                知识库分块
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="knowledge-chunk-size"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    chunkSize（块长）
                  </label>
                  <input
                    id="knowledge-chunk-size"
                    type="number"
                    min={64}
                    max={4096}
                    value={cfg.knowledgeChunkSize}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setCfg((c) => {
                        const next =
                          Number.isFinite(v) && Number.isInteger(v)
                            ? Math.min(4096, Math.max(64, v))
                            : c.knowledgeChunkSize;
                        // overlap 需要保证 overlap < chunkSize
                        const nextOverlap = Math.min(
                          c.knowledgeChunkOverlap,
                          Math.max(0, next - 1)
                        );
                        return {
                          ...c,
                          knowledgeChunkSize: next,
                          knowledgeChunkOverlap: nextOverlap,
                        };
                      });
                    }}
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    用于滑动窗口分块粒度，越大单块越长。
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="knowledge-chunk-overlap"
                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    overlap（相邻冗余）
                  </label>
                  <input
                    id="knowledge-chunk-overlap"
                    type="number"
                    min={0}
                    max={Math.max(0, cfg.knowledgeChunkSize - 1)}
                    value={cfg.knowledgeChunkOverlap}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setCfg((c) => {
                        const max = Math.max(0, c.knowledgeChunkSize - 1);
                        const next =
                          Number.isFinite(v) && Number.isInteger(v)
                            ? Math.min(max, Math.max(0, v))
                            : c.knowledgeChunkOverlap;
                        return { ...c, knowledgeChunkOverlap: next };
                      });
                    }}
                    className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    相邻分片保留重叠内容；overlap 越大上下文冗余越多。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${cardClass} mb-8`}>
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          展示与日志
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              应用 / 机器人展示名称
            </label>
            <input
              id="display-name"
              type="text"
              maxLength={40}
              value={cfg.appDisplayName}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  appDisplayName: e.target.value.slice(0, 40),
                }))
              }
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            />
            <p className="mt-1 text-xs text-zinc-500">
              用于对话页标题与浏览器标签（与根布局 metadata 一致需刷新页面或再次导航）。
            </p>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="logging-enabled"
              type="checkbox"
              checked={cfg.chatLoggingEnabled}
              onChange={(e) =>
                setCfg((c) => ({
                  ...c,
                  chatLoggingEnabled: e.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
            />
            <label
              htmlFor="logging-enabled"
              className="text-sm text-zinc-700 dark:text-zinc-300"
            >
              启用聊天日志（文件 + 控制台）
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white outline-none ring-violet-500 hover:bg-violet-700 focus-visible:ring-2 disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={restore}
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 outline-none ring-violet-500 hover:bg-zinc-100 focus-visible:ring-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          恢复默认
        </button>
      </div>
    </div>
  );
}
