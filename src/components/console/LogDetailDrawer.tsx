"use client";

import { BugOutlined } from "@ant-design/icons";
import { fieldLabelZh } from "@/lib/logs/log-field-labels";
import { MODEL_GROUPS } from "@/lib/provider/models";
import { consumeChatSseStream } from "@/lib/chat/sse-consume";
import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/provider/constants";
import {
  buildLogDebugMessages,
  DEFAULT_LOG_DEBUG_INSTRUCTION,
} from "@/lib/console/build-log-debug-messages";
import { FALLBACK_DEFAULTS } from "@/lib/config/defaults";
import { fetchPublicAppConfig } from "@/lib/config/public-config-client";
import {
  App,
  Button,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  open: boolean;
  record: Record<string, unknown> | null;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
};

const CORE = new Set(["ts", "level", "event", "requestId"]);
const MESSAGE_KEYS = new Set(["messages", "responsePreview"]);

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export function LogDetailDrawer({
  open,
  record,
  onClose,
  returnFocusRef,
}: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const visible = open && !!record;

  useEffect(() => {
    if (!visible) return;
    closeBtnRef.current?.focus();
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const restoreFocus = () => {
    queueMicrotask(() => returnFocusRef.current?.focus());
  };

  return (
    <Drawer
      title={
        record ? (
          <div>
            <div className="text-base font-semibold">日志详情</div>
            {typeof record.event === "string" && (
              <Typography.Text
                type="secondary"
                className="mt-0.5 block truncate text-xs"
              >
                {record.event}
              </Typography.Text>
            )}
          </div>
        ) : (
          "日志详情"
        )
      }
      placement="right"
      width="100%"
      classNames={{
        wrapper: "!w-full md:!w-[min(728px,52vw)]",
      }}
      open={visible}
      onClose={handleClose}
      afterOpenChange={(nextOpen) => {
        if (!nextOpen) restoreFocus();
      }}
      destroyOnHidden
      maskClosable
      keyboard
      extra={
        <Button
          ref={closeBtnRef}
          type="text"
          size="small"
          onClick={handleClose}
          aria-label="关闭"
        >
          关闭
        </Button>
      }
      closable={false}
    >
      {record ? <DetailBody record={record} /> : null}
    </Drawer>
  );
}

function DetailBody({ record }: { record: Record<string, unknown> }) {
  const coreEntries = Array.from(CORE).map((k) => [k, record[k]] as const);
  const restEntries = Object.entries(record).filter(
    ([k]) => !CORE.has(k) && !MESSAGE_KEYS.has(k)
  );
  const messagesBlock =
    "messages" in record ? record.messages : undefined;
  const previewBlock =
    "responsePreview" in record ? record.responsePreview : undefined;

  return (
    <div className="text-sm">
      {(messagesBlock !== undefined || previewBlock !== undefined) && (
        <section className="mb-6">
          <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            消息与预览
          </h3>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            可能含用户消息与模型回复，请注意敏感信息。
          </p>
          {messagesBlock !== undefined && (
            <div className="mb-3 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
              <div className="flex min-h-9 items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/60">
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  {fieldLabelZh("messages")}
                </span>
                <LogMessagesDebugPanel
                  messagesPayload={messagesBlock}
                  record={record}
                />
              </div>
              <pre className="max-h-72 overflow-auto p-3 text-xs leading-relaxed text-zinc-900 dark:text-zinc-100">
                {formatValue(messagesBlock)}
              </pre>
            </div>
          )}
          {previewBlock !== undefined && (
            <div className="mb-1 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
              <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
                {fieldLabelZh("responsePreview")}
              </div>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap p-3 text-xs leading-relaxed text-zinc-900 dark:text-zinc-100">
                {formatValue(previewBlock)}
              </pre>
            </div>
          )}
        </section>
      )}

      <details className="mb-4 rounded-md border border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          核心
        </summary>
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <dl className="space-y-2">
            {coreEntries.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[calc(7rem+50px)_1fr] gap-2">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  {fieldLabelZh(k)}
                </dt>
                <dd className="break-all font-mono text-xs text-zinc-900 dark:text-zinc-100">
                  {formatValue(v)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </details>

      {restEntries.length > 0 && (
        <details className="mb-4 rounded-md border border-zinc-200 dark:border-zinc-800">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            其它字段
            <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
              （{restEntries.length} 项）
            </span>
          </summary>
          <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
            <dl className="space-y-2">
              {restEntries.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[calc(7rem+50px)_1fr] gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    {fieldLabelZh(k)}
                  </dt>
                  <dd className="max-h-40 overflow-auto break-all font-mono text-xs text-zinc-900 dark:text-zinc-100">
                    {formatValue(v)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
      )}

      <section>
        <details className="rounded-md border border-zinc-200 dark:border-zinc-800">
          <summary className="cursor-pointer px-3 py-2 text-zinc-800 dark:text-zinc-200">
            原始 JSON
          </summary>
          <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
            <Button
              type="link"
              size="small"
              className="!px-0 !text-violet-600 dark:!text-violet-400"
              onClick={() => {
                void navigator.clipboard.writeText(
                  JSON.stringify(record, null, 2)
                );
              }}
            >
              复制全部
            </Button>
            <pre className="max-h-64 overflow-auto text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        </details>
      </section>
    </div>
  );
}

function LogMessagesDebugPanel({
  messagesPayload,
  record,
}: {
  messagesPayload: unknown;
  record: Record<string, unknown>;
}) {
  const { message } = App.useApp();
  const [publicCfg, setPublicCfg] = useState<Awaited<
    ReturnType<typeof fetchPublicAppConfig>
  > | null>(null);
  const [currentModel, setCurrentModel] = useState(
    FALLBACK_DEFAULTS.defaultModel
  );
  const [instruction, setInstruction] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | undefined>();

  useEffect(() => {
    void fetchPublicAppConfig().then(setPublicCfg);
  }, []);

  const maxK =
    publicCfg?.maxMessagesInContext ??
    FALLBACK_DEFAULTS.maxMessagesInContext;

  useEffect(() => {
    const def =
      publicCfg?.defaultModel ?? FALLBACK_DEFAULTS.defaultModel;
    const p = record.provider;
    const m = record.model;
    const fromLog =
      p === "deepseek"
        ? DEEPSEEK_DEFAULT_MODEL
        : typeof m === "string" &&
          MODEL_GROUPS.flatMap((g) => g.models).some((x) => x.id === m)
          ? m
          : def;
    setCurrentModel(fromLog);
    setInstruction("");
  }, [record, publicCfg]);

  const modelSelectValue = currentModel;
  const modelOptions = useMemo(
    () =>
      MODEL_GROUPS.flatMap((g) =>
        g.models.map((m) => ({
          label: `${g.label} · ${m.label}`,
          value: m.id,
        }))
      ),
    []
  );

  useEffect(() => {
    if (panelOpen) {
      setOutput("");
      setStreamError(undefined);
    }
  }, [panelOpen]);

  const runDebug = useCallback(async () => {
    const messages = buildLogDebugMessages(
      messagesPayload,
      instruction,
      maxK
    );
    setOutput("");
    setStreamError(undefined);
    setStreaming(true);
    try {
      const body: Record<string, unknown> = {
        messages,
        model: currentModel,
      };
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const { error } = await consumeChatSseStream(res, (t) => {
        setOutput((s) => s + t);
      });
      if (error) {
        setStreamError(error);
        message.error(error);
      }
    } catch {
      const err = "请求失败";
      setStreamError(err);
      message.error(err);
    } finally {
      setStreaming(false);
    }
  }, [instruction, maxK, message, messagesPayload, currentModel]);

  return (
    <>
      <Button
        type="link"
        size="small"
        icon={<BugOutlined className="text-[13px]" />}
        className="!m-0 !h-7 flex-shrink-0 !px-1 !text-xs text-zinc-500 hover:text-zinc-700 dark:!text-zinc-500 dark:hover:text-zinc-300"
        aria-label="模型调试"
        onClick={() => setPanelOpen(true)}
      >
        模型调试
      </Button>

      <Modal
        title="模型调试"
        open={panelOpen}
        onCancel={() => setPanelOpen(false)}
        footer={[
          <Button key="close" onClick={() => setPanelOpen(false)}>
            关闭
          </Button>,
        ]}
        width="min(560px, 92vw)"
        destroyOnHidden
      >
        <p className="mb-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          调用{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-[0.85em] dark:bg-zinc-800">
            POST /api/debug
          </code>
          ，不写聊天落盘日志。说明留空则使用默认提示。
        </p>
        <Space direction="vertical" className="w-full" size="middle">
          <Space wrap className="w-full">
            <Select<string>
              className="min-w-[14rem]"
              size="small"
              showSearch
              optionFilterProp="label"
              value={modelSelectValue}
              options={modelOptions}
              onChange={(v) => {
                const val = String(v);
                setCurrentModel(val);
              }}
            />
          </Space>
          <Input.TextArea
            size="small"
            rows={3}
            placeholder={DEFAULT_LOG_DEBUG_INSTRUCTION}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <Button
            type="primary"
            size="small"
            loading={streaming}
            onClick={runDebug}
          >
            发送并流式输出
          </Button>

          <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <div className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              输出
            </div>
            {streamError ? (
              <Typography.Text type="danger" className="text-sm">
                {streamError}
              </Typography.Text>
            ) : null}
            <pre className="max-h-[min(360px,50vh)] overflow-auto whitespace-pre-wrap rounded border border-zinc-200 bg-zinc-50 p-2 text-xs leading-relaxed text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100">
              {output || (streaming ? "…" : "（尚未发送）")}
            </pre>
          </div>
        </Space>
      </Modal>
    </>
  );
}
