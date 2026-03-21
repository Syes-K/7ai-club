"use client";

import { useCallback, useEffect, useState } from "react";
import { ZHIPU_MODEL_GROUPS } from "@/lib/chat/zhipu-models";
import type { ChatProviderId } from "@/lib/chat/types";
import type { AppConfig } from "@/lib/config/defaults";
import { FALLBACK_DEFAULTS } from "@/lib/config/defaults";

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
              {ZHIPU_MODEL_GROUPS.map((g) => (
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
