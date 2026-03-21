"use client";

import { fieldLabelZh } from "@/lib/logs/log-field-labels";
import { Button, Drawer, Typography } from "antd";
import { useEffect, useRef } from "react";

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
      destroyOnClose
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
              <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
                {fieldLabelZh("messages")}
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
