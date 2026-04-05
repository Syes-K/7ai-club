"use client";

import {
  ArrowLeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { KnowledgeBase, KnowledgeEntry, SearchHit } from "@/lib/knowledge/types";

const SCOPE_NOTICE =
  "当前版本已向量化知识内容，尚未在对话中启用检索；文件上传后续提供。";

const cardClass =
  "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

function previewBody(s: string, n = 80): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}…`;
}

function indexTag(status: KnowledgeEntry["indexStatus"] | undefined | null) {
  const map = {
    ready: { color: "success" as const, text: "就绪" },
    failed: { color: "error" as const, text: "失败" },
    indexing: { color: "processing" as const, text: "索引中" },
    pending: { color: "default" as const, text: "待索引" },
  };
  const key = (status ?? "pending") as keyof typeof map;
  const m = map[key];
  if (!m) {
    // 兜底：历史数据或脏数据可能带来未知 indexStatus，避免 UI 直接崩溃
    return <Tag color="default">{String(status ?? "unknown")}</Tag>;
  }
  return <Tag color={m.color}>{m.text}</Tag>;
}

type DetailRes = {
  base?: KnowledgeBase;
  entries?: KnowledgeEntry[];
  error?: string;
};

export function KnowledgeBaseDetailClient({ baseId }: { baseId: string }) {
  const [base, setBase] = useState<KnowledgeBase | null>(null);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const [entryModal, setEntryModal] = useState<"create" | "title" | "body" | null>(null);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [entryForm] = Form.useForm<{ title?: string; body: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchTopK, setSearchTopK] = useState(5);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHits, setSearchHits] = useState<SearchHit[] | null>(null);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setBanner(null);
    try {
      const res = await fetch(`/api/console/knowledge/${baseId}`);
      const j = (await res.json()) as DetailRes;
      if (res.status === 404) {
        setNotFound(true);
        setBase(null);
        setEntries([]);
        return;
      }
      if (!res.ok) {
        setBanner({ type: "err", text: j.error ?? "加载失败" });
        setBase(null);
        setEntries([]);
        return;
      }
      setBase(j.base ?? null);
      setEntries(Array.isArray(j.entries) ? j.entries : []);
    } catch {
      setBanner({ type: "err", text: "网络错误" });
      setBase(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [baseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreateEntry = () => {
    setEditingEntry(null);
    entryForm.resetFields();
    entryForm.setFieldsValue({ title: "", body: "" });
    setEntryModal("create");
  };

  const openEditTitle = (e: KnowledgeEntry) => {
    setEditingEntry(e);
    entryForm.setFieldsValue({
      title: e.title ?? "",
    });
    setEntryModal("title");
  };

  const openEditBody = (e: KnowledgeEntry) => {
    setEditingEntry(e);
    entryForm.setFieldsValue({
      body: e.body,
    });
    setEntryModal("body");
  };

  const submitEntry = async (v: { title?: string; body: string }) => {
    try {
      if (entryModal === "create") {
        const res = await fetch(`/api/console/knowledge/${baseId}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: v.title?.trim() || null,
            body: v.body,
          }),
        });
        const j = (await res.json()) as { error?: string };
        if (!res.ok) {
          setBanner({ type: "err", text: j.error ?? "保存失败" });
          return;
        }
        setBanner({ type: "ok", text: "已保存并索引" });
      } else if (entryModal === "title" && editingEntry) {
        const nextTitle = v.title?.trim() || null;
        const titleChanged = nextTitle !== (editingEntry.title ?? null);
        if (!titleChanged) {
          setBanner({ type: "ok", text: "未检测到变更" });
          return;
        }
        const res = await fetch(
          `/api/console/knowledge/${baseId}/entries/${editingEntry.id}/meta`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: nextTitle }),
          }
        );
        const j = (await res.json()) as { error?: string };
        if (!res.ok) {
          setBanner({ type: "err", text: j.error ?? "保存失败" });
          return;
        }
        setBanner({ type: "ok", text: "已更新标题" });
      } else if (entryModal === "body" && editingEntry) {
        const nextBody = v.body.trim();
        const bodyChanged = nextBody !== editingEntry.body;
        if (!bodyChanged) {
          setBanner({ type: "ok", text: "未检测到变更" });
          return;
        }
        const res = await fetch(
          `/api/console/knowledge/${baseId}/entries/${editingEntry.id}/body`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: nextBody }),
          }
        );
        const j = (await res.json()) as { error?: string };
        if (!res.ok) {
          setBanner({ type: "err", text: j.error ?? "保存失败" });
          return;
        }
        setBanner({ type: "ok", text: "已保存并重新索引" });
      }
      setEntryModal(null);
      setEditingEntry(null);
      await load();
    } catch {
      setBanner({ type: "err", text: "网络错误" });
    }
  };

  const removeEntry = (e: KnowledgeEntry) => {
    if (!confirm("将删除该文档及对应向量，确定删除？")) return;
    void (async () => {
      try {
        const res = await fetch(
          `/api/console/knowledge/${baseId}/entries/${e.id}`,
          { method: "DELETE" }
        );
        const j = (await res.json()) as { error?: string };
        if (!res.ok) {
          setBanner({ type: "err", text: j.error ?? "删除失败" });
          return;
        }
        setBanner({ type: "ok", text: "已删除文档" });
        await load();
      } catch {
        setBanner({ type: "err", text: "网络错误" });
      }
    })();
  };

  const reindex = (e: KnowledgeEntry) => {
    void (async () => {
      setBanner(null);
      try {
        const res = await fetch(
          `/api/console/knowledge/${baseId}/entries/${e.id}/reindex`,
          { method: "POST" }
        );
        const j = (await res.json()) as { error?: string };
        if (!res.ok) {
          setBanner({ type: "err", text: j.error ?? "重试失败" });
          return;
        }
        setBanner({ type: "ok", text: "已重新索引" });
        await load();
      } catch {
        setBanner({ type: "err", text: "网络错误" });
      }
    })();
  };

  const runSearch = () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchErr("请输入查询");
      setSearchHits(null);
      return;
    }
    void (async () => {
      setSearchLoading(true);
      setSearchErr(null);
      setSearchHits(null);
      try {
        const res = await fetch(
          `/api/console/knowledge/${baseId}/search-preview`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: q, topK: searchTopK }),
          }
        );
        const j = (await res.json()) as { hits?: SearchHit[]; error?: string };
        if (!res.ok) {
          setSearchErr(j.error ?? "检索失败");
          return;
        }
        setSearchHits(Array.isArray(j.hits) ? j.hits : []);
      } catch {
        setSearchErr("网络错误");
      } finally {
        setSearchLoading(false);
      }
    })();
  };

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">知识库不存在或已被删除。</p>
        <Link href="/console/knowledge">
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            返回列表
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/console/knowledge"
          className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline dark:text-violet-400"
        >
          <ArrowLeftOutlined />
          知识库列表
        </Link>
      </div>

      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{SCOPE_NOTICE}</p>

      {banner && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${banner.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
            }`}
        >
          {banner.text}
        </div>
      )}

      <div className={`${cardClass} mb-6`}>
        <Typography.Title level={4} className="!mb-1">
          {base?.name ?? "…"}
        </Typography.Title>
        {base?.description ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{base.description}</p>
        ) : null}
      </div>

      <div className={`${cardClass} mb-6 flex flex-wrap items-center justify-between gap-4`}>
        <Typography.Title level={5} className="!mb-0">
          文本文档
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateEntry}>
          添加文档
        </Button>
      </div>

      <div className={cardClass}>
        {entries.length === 0 && !loading ? (
          <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <p className="mb-4">暂无文档，点击「添加文档」录入纯文本内容。</p>
            <Button type="primary" onClick={openCreateEntry}>
              添加文档
            </Button>
          </div>
        ) : (
          <Table<KnowledgeEntry>
            rowKey="id"
            loading={loading}
            pagination={false}
            dataSource={entries}
            scroll={{ x: "max-content" }}
            columns={[
              {
                title: "标题",
                key: "title",
                width: 160,
                render: (_, row) =>
                  row.title ? (
                    <span>{row.title}</span>
                  ) : (
                    <span className="text-zinc-400">（无标题）</span>
                  ),
              },
              {
                title: "正文预览",
                key: "preview",
                ellipsis: true,
                render: (_, row) => (
                  <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {previewBody(row.body)}
                  </span>
                ),
              },
              {
                title: "索引",
                dataIndex: "indexStatus",
                key: "indexStatus",
                width: 100,
                render: (s: KnowledgeEntry["indexStatus"], row) => (
                  <Space direction="vertical" size={4}>
                    {indexTag(s)}
                    {s === "failed" && row.indexError ? (
                      <span
                        className="max-w-[200px] truncate text-xs text-red-600 dark:text-red-400"
                        title={row.indexError}
                      >
                        {row.indexError}
                      </span>
                    ) : null}
                  </Space>
                ),
              },
              {
                title: "更新时间",
                dataIndex: "updatedAt",
                key: "updatedAt",
                width: 168,
                render: (t: number) =>
                  new Date(t).toLocaleString("zh-CN", { hour12: false }),
              },
              {
                title: "操作",
                key: "actions",
                width: 200,
                fixed: "right",
                render: (_, row) => (
                  <Space size="small" wrap>
                    <Link
                      href={`/knowledge/preview/${row.id}?baseId=${encodeURIComponent(baseId)}`}
                      className="text-sm text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
                    >
                      预览
                    </Link>
                    <Button
                      type="link"
                      size="small"
                      className="!px-0"
                      onClick={() => openEditTitle(row)}
                    >
                      修改标题
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      className="!px-0"
                      onClick={() => openEditBody(row)}
                    >
                      修改正文
                    </Button>
                    {row.indexStatus === "failed" ? (
                      <Button
                        type="link"
                        size="small"
                        className="!px-0"
                        icon={<ReloadOutlined />}
                        onClick={() => reindex(row)}
                      >
                        重试索引
                      </Button>
                    ) : null}
                    <Button
                      type="link"
                      size="small"
                      danger
                      className="!px-0"
                      onClick={() => removeEntry(row)}
                    >
                      删除
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </div>

      <div className={`${cardClass} mt-6`}>
        <Collapse
          bordered={false}
          className="!bg-transparent"
          items={[
            {
              key: "search",
              label: (
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  <SearchOutlined className="mr-2" />
                  检索试查（调试用）
                </span>
              ),
              children: (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    仅管理端试检索，结果不进入对话。
                  </p>
                  <Space wrap className="w-full" size="middle">
                    <Input
                      className="min-w-[200px] flex-1"
                      placeholder="查询文本"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onPressEnter={() => runSearch()}
                    />
                    <Space>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        topK
                      </span>
                      <InputNumber
                        min={1}
                        max={20}
                        value={searchTopK}
                        onChange={(n) => setSearchTopK(Number(n) || 5)}
                      />
                    </Space>
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      loading={searchLoading}
                      onClick={() => runSearch()}
                    >
                      检索
                    </Button>
                  </Space>
                  {searchErr ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{searchErr}</p>
                  ) : null}
                  {searchHits && searchHits.length === 0 ? (
                    <p className="text-sm text-zinc-500">无命中</p>
                  ) : null}
                  {searchHits && searchHits.length > 0 ? (
                    <ul className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                      {searchHits.map((h) => (
                        <li
                          key={h.chunkId}
                          className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                        >
                          <div className="mb-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                            <span>文档 {h.entryId.slice(0, 8)}…</span>
                            <span>块 #{h.chunkIndex}</span>
                            <span>
                              字符 [{h.charStart}, {h.charEnd}]
                            </span>
                            <span>score {h.score.toFixed(4)}</span>
                          </div>
                          <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-800 dark:text-zinc-200">
                            {h.text}
                          </pre>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={
          entryModal === "create"
            ? "新建文档"
            : entryModal === "title"
              ? "修改标题"
              : "修改正文"
        }
        open={entryModal !== null}
        onCancel={() => {
          setEntryModal(null);
          setEditingEntry(null);
        }}
        footer={null}
        width={640}
      >
        <Form
          form={entryForm}
          layout="vertical"
          onFinish={(v) => void submitEntry(v)}
          className="mt-2"
        >
          {entryModal !== "body" ? (
            <Form.Item name="title" label="标题（可选）">
              <Input placeholder="最多 200 字符" maxLength={200} showCount />
            </Form.Item>
          ) : null}
          {entryModal !== "title" ? (
            <Form.Item
              name="body"
              label="正文"
              rules={[{ required: true, message: "请输入正文" }]}
            >
              <Input.TextArea
                rows={12}
                className="font-mono text-sm"
                placeholder="必填，纯文本"
              />
            </Form.Item>
          ) : null}
          <Form.Item className="!mb-0 flex justify-end gap-2">
            <Space>
              <Button
                onClick={() => {
                  setEntryModal(null);
                  setEditingEntry(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
