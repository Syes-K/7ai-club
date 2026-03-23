"use client";

import { QuestionCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import { useCallback, useEffect, useState } from "react";
import type { PromptTemplatesPayload } from "@/lib/prompt-templates/validate-save";
import { validatePromptTemplatesForSave } from "@/lib/prompt-templates/validate-save";

type Props = {
  initialTemplates: PromptTemplatesPayload;
  initialBuiltin: PromptTemplatesPayload;
  initialFileWarning: string | null;
};

const TIP_INJECT =
  "含义：当会话超过「最近 N 条」窗口时，服务端会在发给对话模型的消息列表最前插入一条 system。用法：可在模板末尾使用恰好一处 {{content}}，摘要正文将替换该占位符；若不使用占位符，则摘要全文拼接在模板渲染结果之后。除 {{content}} 外不允许其它占位符；使用 {{content}} 时须放在末尾，且其前须有说明文字。";

const TIP_SYSTEM =
  "含义：用于后台刷新滚动摘要的那次模型调用（与用户在界面里和模型聊天不是同一次请求）。用法：必须保留 {{maxChars}}，对应应用配置里的摘要最大字符数；可调整语气与输出要求，但不要删掉长度相关约束。其它占位符 V1 不允许。\n\n占位符：仅 {{maxChars}}，表示摘要输出最大字符数（与「应用配置」中一致，由服务端注入）。";

export function PromptTemplatesForm({
  initialTemplates,
  initialBuiltin,
  initialFileWarning,
}: Props) {
  const [tpl, setTpl] = useState<PromptTemplatesPayload>(() => ({
    ...initialTemplates,
  }));
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
    const local = validatePromptTemplatesForSave(tpl);
    if (!local.ok) {
      setError(local.error);
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/console/prompt-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local.templates),
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
  }, [tpl]);

  const restore = useCallback(() => {
    if (
      !confirm(
        "确定将提示词恢复为内置默认值？未保存的修改将丢失；仍需点击「保存」才会写入文件。"
      )
    ) {
      return;
    }
    setTpl({ ...initialBuiltin });
    setError(null);
    setSuccess(false);
  }, [initialBuiltin]);

  const cardClass =
    "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

  const titleWithTip = (text: string, tip: string) => (
    <span className="inline-flex items-center gap-1.5">
      {text}
      <Tooltip title={<span className="whitespace-pre-line">{tip}</span>}>
        <QuestionCircleOutlined
          className="cursor-help text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="说明"
        />
      </Tooltip>
    </span>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        以下为发往大模型的服务端提示词模板；保存后写入{" "}
        <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
          data/prompt-templates.json
        </code>
        。各字段含义、用法与占位符说明见标题旁问号。
      </p>

      {fileWarn && (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
        >
          {fileWarn}
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

      <section className={`${cardClass} mb-6 space-y-4`}>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {titleWithTip("摘要注入前缀", TIP_INJECT)}
        </h2>
        <div>
          <label
            htmlFor="tpl-inject"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            模板正文
          </label>
          <textarea
            id="tpl-inject"
            value={tpl.contextSummaryInjectPrefix}
            onChange={(e) =>
              setTpl((t) => ({
                ...t,
                contextSummaryInjectPrefix: e.target.value,
              }))
            }
            rows={10}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm leading-relaxed dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          配置键 <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">contextSummaryInjectPrefix</code>
        </p>
      </section>

      <section className={`${cardClass} mb-8 space-y-4`}>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {titleWithTip("摘要生成系统提示", TIP_SYSTEM)}
        </h2>
        <div>
          <label
            htmlFor="tpl-system"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            模板正文
          </label>
          <textarea
            id="tpl-system"
            value={tpl.contextSummarySystem}
            onChange={(e) =>
              setTpl((t) => ({
                ...t,
                contextSummarySystem: e.target.value,
              }))
            }
            rows={12}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm leading-relaxed dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          配置键 <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">contextSummarySystem</code>
        </p>
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
