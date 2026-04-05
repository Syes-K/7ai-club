"use client";

import { PlusOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Space, Table, Typography } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { KnowledgeBase } from "@/lib/knowledge/types";

const SCOPE_NOTICE =
  "当前版本已向量化知识内容，尚未在对话中启用检索；文件上传后续提供。";

const cardClass =
  "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

type ListRes = { bases?: KnowledgeBase[]; error?: string };

export function KnowledgeBasesClient() {
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeBase | null>(null);
  const [createForm] = Form.useForm<{ name: string; description?: string }>();
  const [editForm] = Form.useForm<{ name: string; description?: string }>();

  const load = useCallback(async () => {
    setLoading(true);
    setBanner(null);
    try {
      const res = await fetch("/api/console/knowledge");
      const j = (await res.json()) as ListRes;
      if (!res.ok) {
        setBanner({ type: "err", text: j.error ?? "加载失败" });
        setBases([]);
        return;
      }
      setBases(Array.isArray(j.bases) ? j.bases : []);
    } catch {
      setBanner({ type: "err", text: "网络错误" });
      setBases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    createForm.resetFields();
    setCreateOpen(true);
  };

  const submitCreate = async (v: { name: string; description?: string }) => {
    try {
      const res = await fetch("/api/console/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          description: v.description?.trim() || undefined,
        }),
      });
      const j = (await res.json()) as { base?: KnowledgeBase; error?: string };
      if (!res.ok) {
        setBanner({ type: "err", text: j.error ?? "创建失败" });
        return;
      }
      setCreateOpen(false);
      setBanner({ type: "ok", text: "已创建知识库" });
      await load();
    } catch {
      setBanner({ type: "err", text: "网络错误" });
    }
  };

  const openEdit = (b: KnowledgeBase) => {
    setEditing(b);
    editForm.setFieldsValue({
      name: b.name,
      description: b.description ?? "",
    });
    setEditOpen(true);
  };

  const submitEdit = async (v: { name: string; description?: string }) => {
    if (!editing) return;
    try {
      const res = await fetch(`/api/console/knowledge/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          description: v.description?.trim() || null,
        }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setBanner({ type: "err", text: j.error ?? "保存失败" });
        return;
      }
      setEditOpen(false);
      setEditing(null);
      setBanner({ type: "ok", text: "已更新" });
      await load();
    } catch {
      setBanner({ type: "err", text: "网络错误" });
    }
  };

  const removeBase = (b: KnowledgeBase) => {
    if (
      !confirm(
        `将删除知识库「${b.name}」及库内全部文档与已生成向量，确定删除？`
      )
    ) {
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`/api/console/knowledge/${b.id}`, {
          method: "DELETE",
        });
        const j = (await res.json()) as { error?: string };
        if (!res.ok) {
          setBanner({ type: "err", text: j.error ?? "删除失败" });
          return;
        }
        setBanner({ type: "ok", text: "已删除知识库" });
        await load();
      } catch {
        setBanner({ type: "err", text: "网络错误" });
      }
    })();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{SCOPE_NOTICE}</p>

      {banner && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            banner.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className={`${cardClass} mb-6 flex flex-wrap items-center justify-between gap-4`}>
        <Typography.Title level={4} className="!mb-0">
          知识库列表
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建知识库
        </Button>
      </div>

      <div className={cardClass}>
        {bases.length === 0 && !loading ? (
          <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <p className="mb-4">暂无知识库，点击「新建知识库」开始。</p>
            <Button type="primary" onClick={openCreate}>
              新建知识库
            </Button>
          </div>
        ) : (
          <Table<KnowledgeBase>
            rowKey="id"
            loading={loading}
            pagination={false}
            dataSource={bases}
            columns={[
              {
                title: "名称",
                dataIndex: "name",
                key: "name",
                render: (name: string, row) => (
                  <Link
                    href={`/console/knowledge/${row.id}`}
                    className="font-medium text-violet-600 hover:underline dark:text-violet-400"
                  >
                    {name}
                  </Link>
                ),
              },
              {
                title: "描述",
                dataIndex: "description",
                key: "description",
                ellipsis: true,
                render: (d: string | null) =>
                  d ? (
                    <span className="text-zinc-600 dark:text-zinc-400">{d}</span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  ),
              },
              {
                title: "文档数",
                dataIndex: "entryCount",
                key: "entryCount",
                width: 88,
              },
              {
                title: "更新时间",
                dataIndex: "updatedAt",
                key: "updatedAt",
                width: 180,
                render: (t: number) =>
                  new Date(t).toLocaleString("zh-CN", { hour12: false }),
              },
              {
                title: "操作",
                key: "actions",
                width: 200,
                render: (_, row) => (
                  <Space size="small" wrap>
                    <Link
                      href={`/console/knowledge/${row.id}`}
                      className="text-sm text-violet-600 hover:underline dark:text-violet-400"
                    >
                      进入
                    </Link>
                    <Button
                      type="link"
                      size="small"
                      className="!px-0"
                      onClick={() => openEdit(row)}
                    >
                      重命名
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      danger
                      className="!px-0"
                      onClick={() => removeBase(row)}
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

      <Modal
        title="新建知识库"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(v) => void submitCreate(v)}
          className="mt-2"
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="1～120 字符" maxLength={120} showCount />
          </Form.Item>
          <Form.Item name="description" label="描述（可选）">
            <Input.TextArea rows={3} placeholder="可选" />
          </Form.Item>
          <Form.Item className="!mb-0 flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑知识库"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(v) => void submitEdit(v)}
          className="mt-2"
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="1～120 字符" maxLength={120} showCount />
          </Form.Item>
          <Form.Item name="description" label="描述（可选）">
            <Input.TextArea rows={3} placeholder="可选" />
          </Form.Item>
          <Form.Item className="!mb-0 flex justify-end gap-2">
            <Button
              onClick={() => {
                setEditOpen(false);
                setEditing(null);
              }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
