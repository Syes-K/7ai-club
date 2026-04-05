"use client";

import { App, Button, Form, Input, Select, Space, Typography } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AssistantRow } from "@/lib/assistants/types";
import type { KnowledgeBase } from "@/lib/knowledge/types";

const cardClass =
  "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

type FormVals = {
  name: string;
  prompt: string;
  iconEmoji: string;
  knowledgeBaseIds: string[];
  openingMessage: string;
};

function normalizePayload(v: FormVals) {
  return {
    name: v.name.trim(),
    prompt: v.prompt.trim(),
    iconEmoji: v.iconEmoji.trim() ? v.iconEmoji.trim() : null,
    knowledgeBaseIds: v.knowledgeBaseIds ?? [],
    openingMessage: (v.openingMessage ?? "").trim(),
  };
}

/** 须包在 antd `<App>` 内，以便 message / modal 使用主题上下文 */
function AssistantFormInner({
  mode,
  assistantId,
}: {
  mode: "new" | "edit";
  assistantId?: string;
}) {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<FormVals>();
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [basesLoading, setBasesLoading] = useState(true);
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);

  const loadBases = useCallback(async () => {
    setBasesLoading(true);
    try {
      const res = await fetch("/api/console/knowledge");
      const j = (await res.json()) as { bases?: KnowledgeBase[] };
      if (res.ok && Array.isArray(j.bases)) setBases(j.bases);
      else setBases([]);
    } catch {
      setBases([]);
    } finally {
      setBasesLoading(false);
    }
  }, []);

  const loadAssistant = useCallback(async () => {
    if (mode !== "edit" || !assistantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/console/assistants/${assistantId}`);
      const j = (await res.json()) as { assistant?: AssistantRow; error?: string };
      if (!res.ok || !j.assistant) {
        message.error(j.error ?? "加载失败");
        router.replace("/console/assistants");
        return;
      }
      const a = j.assistant;
      form.setFieldsValue({
        name: a.name,
        prompt: a.prompt,
        iconEmoji: a.iconEmoji ?? "",
        knowledgeBaseIds: a.knowledgeBaseIds,
        openingMessage: a.openingMessage ?? "",
      });
    } catch {
      message.error("网络错误");
      router.replace("/console/assistants");
    } finally {
      setLoading(false);
    }
  }, [assistantId, form, message, mode, router]);

  useEffect(() => {
    void loadBases();
  }, [loadBases]);

  useEffect(() => {
    if (mode === "new") {
      form.setFieldsValue({
        name: "",
        prompt: "",
        iconEmoji: "",
        knowledgeBaseIds: [],
        openingMessage: "",
      });
      return;
    }
    if (assistantId) void loadAssistant();
  }, [assistantId, form, loadAssistant, mode]);

  const onFinish = async (v: FormVals) => {
    const body = normalizePayload(v);
    setSubmitting(true);
    try {
      if (mode === "new") {
        const res = await fetch("/api/console/assistants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = (await res.json()) as { error?: string };
        if (!res.ok) {
          message.error(j.error ?? "创建失败");
          return;
        }
        message.success("已创建");
        router.push("/console/assistants");
        return;
      }
      if (!assistantId) return;
      const res = await fetch(`/api/console/assistants/${assistantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        message.error(j.error ?? "保存失败");
        return;
      }
      message.success("已保存");
      router.push("/console/assistants");
    } catch {
      message.error("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = () => {
    if (mode !== "edit" || !assistantId) return;
    modal.confirm({
      title: "删除助手？",
      content:
        "已有会话可能仍引用该助手的历史快照；删除后无法恢复。确定删除？",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        const res = await fetch(`/api/console/assistants/${assistantId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          message.error(j.error ?? "删除失败");
          return;
        }
        message.success("已删除");
        router.push("/console/assistants");
      },
    });
  };

  return (
    <div className={cardClass}>
      <Typography.Title level={4} className="!mb-6">
        {mode === "new" ? "新建助手" : "编辑助手"}
      </Typography.Title>
      <Form<FormVals>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="max-w-3xl"
      >
        {loading ? (
          <p className="text-sm text-zinc-500">加载中…</p>
        ) : (
          <>
        <Form.Item
          label="名称"
          name="name"
          rules={[
            { required: true, message: "请输入名称" },
            { max: 80, message: "不超过 80 字符" },
          ]}
        >
          <Input placeholder="助手显示名称" />
        </Form.Item>
        <Form.Item
          label="提示词"
          name="prompt"
          rules={[
            { required: true, message: "请输入提示词" },
            { max: 32_000, message: "不超过 32000 字符" },
          ]}
        >
          <Input.TextArea rows={8} placeholder="系统提示词" />
        </Form.Item>
        <Form.Item label="图标（emoji）" name="iconEmoji">
          <Input maxLength={16} placeholder="例如 🤖" />
        </Form.Item>
        <Form.Item label="关联知识库" name="knowledgeBaseIds">
          <Select
            mode="multiple"
            allowClear
            loading={basesLoading}
            placeholder="可不选"
            options={bases.map((b) => ({ label: b.name, value: b.id }))}
            className="w-full"
          />
        </Form.Item>
        {!basesLoading && bases.length === 0 && (
          <p className="mb-4 text-sm text-zinc-500">
            暂无知识库，请先在知识库中创建
          </p>
        )}
        <Form.Item
          label="开场白"
          name="openingMessage"
          extra="可选。会话开始时在对话区展示一条固定文案（非模型生成）。"
          rules={[{ max: 4000, message: "不超过 4000 字符" }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="例如：你好，我是××助手，可以帮你……"
            showCount
            maxLength={4000}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              保存
            </Button>
            <Link href="/console/assistants">
              <Button>返回列表</Button>
            </Link>
            {mode === "edit" && (
              <Button danger onClick={onDelete}>
                删除助手
              </Button>
            )}
          </Space>
        </Form.Item>
          </>
        )}
      </Form>
    </div>
  );
}

export function AssistantFormClient(props: {
  mode: "new" | "edit";
  assistantId?: string;
}) {
  return (
    <App>
      <AssistantFormInner {...props} />
    </App>
  );
}
