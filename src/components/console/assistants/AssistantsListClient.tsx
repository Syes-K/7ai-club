"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Space, Table, Typography } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AssistantListItem } from "@/lib/assistants/types";

const cardClass =
  "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

export function AssistantsListClient() {
  const [rows, setRows] = useState<AssistantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/console/assistants");
      const j = (await res.json()) as {
        assistants?: AssistantListItem[];
        error?: string;
      };
      if (!res.ok) {
        setError(j.error ?? "加载失败");
        setRows([]);
        return;
      }
      setRows(Array.isArray(j.assistants) ? j.assistants : []);
    } catch {
      setError("网络错误");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-full flex-1">
      <div className={cardClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Typography.Title level={4} className="!mb-0">
            助手
          </Typography.Title>
          <Link href="/console/assistants/new">
            <Button type="primary" icon={<PlusOutlined />}>
              新建助手
            </Button>
          </Link>
        </div>
        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <Table<AssistantListItem>
          rowKey="id"
          loading={loading}
          pagination={false}
          dataSource={rows}
          columns={[
            {
              title: "名称",
              render: (_, r) => (
                <Space>
                  <span className="text-lg" aria-hidden>
                    {r.iconEmoji?.trim() || "🤖"}
                  </span>
                  <span>{r.name}</span>
                </Space>
              ),
            },
            {
              title: "关联知识库",
              render: (_, r) => r.knowledgeBaseIds.length,
            },
            {
              title: "开场白",
              render: (_, r) => (r.hasOpeningMessage ? "已填写" : "—"),
            },
            {
              title: "更新时间",
              render: (_, r) =>
                new Date(r.updatedAt).toLocaleString("zh-CN", {
                  dateStyle: "short",
                  timeStyle: "short",
                }),
            },
            {
              title: "操作",
              width: 120,
              render: (_, r) => (
                <Link href={`/console/assistants/${r.id}`}>编辑</Link>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
