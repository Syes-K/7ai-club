"use client";

import {
  ApiOutlined,
  ExclamationCircleOutlined,
  NodeIndexOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import type { IntentRoutingConfig, IntentRoutingFieldError } from "@/lib/intent-routing";
import type { KnowledgeBase, KnowledgeEntry } from "@/lib/knowledge/types";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tooltip,
  Tag,
  Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { randomUUID } from "@/lib/random-uuid";

type ConfigGetResponse = {
  config?: IntentRoutingConfig;
  warning?: string;
  error?: string;
};

type ValidateResponse = {
  valid?: boolean;
  fieldErrors?: IntentRoutingFieldError[];
  error?: string;
};

type SaveResponse = {
  ok?: boolean;
  version?: string;
  updatedAt?: string;
  updatedBy?: string;
  fieldErrors?: IntentRoutingFieldError[];
  error?: string;
};

type ExecuteOnceResponse = {
  traces?: Array<{ nodeId: string; nodeType: string; status: string; durationMs: number }>;
  intentHit?: boolean;
  fallbackReason?: string;
  finalAnswer?: string;
  error?: string;
};

type RouteRow = {
  key: string;
  intentId: string;
  enabled: boolean;
  keywords: string[];
  nextNodes: string[];
  selectedKnowledgeBaseEntryIds: string[];
  updatedBy: string;
};

type KnowledgeOption = {
  label: string;
  value: string;
  extra?: string;
};

const NODE_OPTIONS = [
  { label: "knowledge_search", value: "knowledge_search" },
  { label: "model_request", value: "model_request" },
  { label: "final_response", value: "final_response" },
];

function parseKeywordsInput(v: string): string[] {
  return v
    .split(/[\n,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatKeywordsInput(v: string[]): string {
  return v.join(", ");
}

function summarizeKnowledgeLabels(ids: string[], options: KnowledgeOption[]): string {
  if (!ids.length) return "-";
  const map = new Map(options.map((opt) => [opt.value, opt.label]));
  return ids.map((id) => map.get(id) ?? id).join(", ");
}

function extractKnowledgeEntryIdsByIntent(
  config: IntentRoutingConfig
): Record<string, string[]> {
  const n = config.nodes.find((item) => item.id === "knowledge_search");
  const raw = n?.input?.selectedKnowledgeBaseEntryIdsByIntent;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: Record<string, string[]> = {};
  for (const [intentId, idsRaw] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(idsRaw)) continue;
    result[intentId] = idsRaw.filter(
      (id): id is string => typeof id === "string" && !!id.trim()
    );
  }
  return result;
}

function buildConfigFromDraft(
  base: IntentRoutingConfig,
  routes: RouteRow[]
): IntentRoutingConfig {
  const selectedKnowledgeBaseEntryIdsByIntent: Record<string, string[]> = {};
  routes.forEach((route) => {
    const intentId = route.intentId.trim();
    if (!intentId) return;
    selectedKnowledgeBaseEntryIdsByIntent[intentId] = route.selectedKnowledgeBaseEntryIds;
  });

  // 统一在提交前回写 knowledge_search 节点输入（按意图维度），避免路由编辑与节点输入状态分裂。
  return {
    ...base,
    routes: routes.map((r) => ({
      intentId: r.intentId.trim(),
      enabled: r.enabled,
      keywords: r.keywords,
      nextNodes: r.nextNodes,
      updatedBy: r.updatedBy.trim() || "console",
    })),
    nodes: base.nodes.map((n) => {
      if (n.id !== "knowledge_search") return n;
      return {
        ...n,
        input: {
          ...n.input,
          selectedKnowledgeBaseEntryIdsByIntent,
        },
      };
    }),
  };
}

export function IntentRoutingConfigApp() {
  const { message, modal } = App.useApp();
  const [addRouteForm] = Form.useForm<{
    intentId: string;
    enabled: boolean;
    keywordsText: string;
    nextNodes: string[];
    selectedKnowledgeBaseEntryIds: string[];
  }>();
  const [executeForm] = Form.useForm<{
    debugIntentId: string;
    debugQuery: string;
  }>();
  const [editRouteForm] = Form.useForm<{
    intentId: string;
    enabled: boolean;
    keywordsText: string;
    nextNodes: string[];
    selectedKnowledgeBaseEntryIds: string[];
  }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setValidating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [serverConfig, setServerConfig] = useState<IntentRoutingConfig | null>(null);
  const [routesDraft, setRoutesDraft] = useState<RouteRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<IntentRoutingFieldError[]>([]);
  const [knowledgeOptions, setKnowledgeOptions] = useState<KnowledgeOption[]>([]);
  const [debugResult, setDebugResult] = useState<ExecuteOnceResponse | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [addRouteOpen, setAddRouteOpen] = useState(false);
  const [editingRouteKey, setEditingRouteKey] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  /** 仅客户端为 true；首屏与 SSR 同构，避免加载区 DOM 与缓存的旧 bundle 不一致导致 hydration 失败 */
  const [hydrated, setHydrated] = useState(false);

  const kbRequiredLocalError = useMemo(() => {
    const hit = routesDraft.find(
      (route) =>
        route.nextNodes.includes("knowledge_search") &&
        (!Array.isArray(route.selectedKnowledgeBaseEntryIds) ||
          route.selectedKnowledgeBaseEntryIds.length < 1)
    );
    return hit
      ? `意图 ${hit.intentId || "(未填写 intentId)"} 包含 knowledge_search，必须至少选择 1 个知识库文档`
      : null;
  }, [routesDraft]);

  const loadKnowledgeOptions = useCallback(async () => {
    const basesRes = await fetch("/api/console/knowledge");
    const basesJson = (await basesRes.json().catch(() => ({}))) as {
      bases?: KnowledgeBase[];
      error?: string;
    };
    if (!basesRes.ok) {
      throw new Error(basesJson.error ?? "无法加载知识库列表");
    }
    const bases = Array.isArray(basesJson.bases) ? basesJson.bases : [];
    if (bases.length === 0) {
      setKnowledgeOptions([]);
      return;
    }

    const detailResults = await Promise.all(
      bases.map(async (base) => {
        const res = await fetch(`/api/console/knowledge/${base.id}`);
        const json = (await res.json().catch(() => ({}))) as {
          entries?: KnowledgeEntry[];
        };
        if (!res.ok) return [];
        const entries = Array.isArray(json.entries) ? json.entries : [];
        return entries.map<KnowledgeOption>((entry) => ({
          value: entry.id,
          label: `${base.name} / ${entry.title?.trim() || entry.id.slice(0, 8)}`,
          extra: entry.id,
        }));
      })
    );
    setKnowledgeOptions(detailResults.flat());
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setWarning(null);
    setFieldErrors([]);
    try {
      const [configRes] = await Promise.all([
        fetch("/api/console/intent-routing/config"),
        loadKnowledgeOptions(),
      ]);
      const configJson = (await configRes.json().catch(() => ({}))) as ConfigGetResponse;
      if (!configRes.ok || !configJson.config) {
        throw new Error(configJson.error ?? "加载配置失败");
      }
      const config = configJson.config;
      const selectedByIntent = extractKnowledgeEntryIdsByIntent(config);
      setServerConfig(config);
      setWarning(configJson.warning ?? null);
      setRoutesDraft(
        (config.routes ?? []).map((r) => ({
          key: r.intentId || randomUUID(),
          intentId: r.intentId,
          enabled: r.enabled,
          keywords: Array.isArray(r.keywords) ? r.keywords : [],
          nextNodes: Array.isArray(r.nextNodes) ? r.nextNodes : [],
          selectedKnowledgeBaseEntryIds: selectedByIntent[r.intentId] ?? [],
          updatedBy: typeof r.updatedBy === "string" && r.updatedBy.trim() ? r.updatedBy : "console",
        }))
      );
      setIsDirty(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "加载失败";
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [loadKnowledgeOptions]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    // 仅拦截浏览器刷新/关闭，避免误丢失未保存草稿。
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const openAddRouteModal = useCallback(() => {
    setAddRouteOpen(true);
  }, []);

  const submitAddRoute = useCallback(async () => {
    try {
      const values = await addRouteForm.validateFields();
      const intentId = values.intentId.trim();
      if (!intentId) {
        addRouteForm.setFields([{ name: "intentId", errors: ["intentId 不能为空"] }]);
        return;
      }
      if (routesDraft.some((route) => route.intentId.trim() === intentId)) {
        addRouteForm.setFields([{ name: "intentId", errors: ["intentId 已存在"] }]);
        return;
      }
      const keywords = parseKeywordsInput(values.keywordsText || "");
      const nextNodes = Array.isArray(values.nextNodes) ? values.nextNodes : [];
      const selectedKnowledgeBaseEntryIds = Array.isArray(values.selectedKnowledgeBaseEntryIds)
        ? values.selectedKnowledgeBaseEntryIds
        : [];
      setRoutesDraft((prev) => [
        ...prev,
        {
          key: randomUUID(),
          intentId,
          enabled: values.enabled !== false,
          keywords,
          nextNodes,
          selectedKnowledgeBaseEntryIds,
          updatedBy: "console",
        },
      ]);
      setIsDirty(true);
      setAddRouteOpen(false);
      message.success("已新增意图路由");
    } catch {
      // 表单校验错误由 antd 接管展示
    }
  }, [addRouteForm, message, routesDraft]);

  const openEditRouteModal = useCallback((route: RouteRow) => {
    setEditingRouteKey(route.key);
  }, []);

  const submitEditRoute = useCallback(async () => {
    if (!editingRouteKey) return;
    try {
      const values = await editRouteForm.validateFields();
      const intentId = values.intentId.trim();
      if (!intentId) {
        editRouteForm.setFields([{ name: "intentId", errors: ["intentId 不能为空"] }]);
        return;
      }
      const duplicated = routesDraft.some(
        (route) => route.key !== editingRouteKey && route.intentId.trim() === intentId
      );
      if (duplicated) {
        editRouteForm.setFields([{ name: "intentId", errors: ["intentId 已存在"] }]);
        return;
      }
      setRoutesDraft((prev) =>
        prev.map((route) =>
          route.key !== editingRouteKey
            ? route
            : {
                ...route,
                intentId,
                enabled: values.enabled !== false,
                keywords: parseKeywordsInput(values.keywordsText || ""),
                nextNodes: Array.isArray(values.nextNodes) ? values.nextNodes : [],
                selectedKnowledgeBaseEntryIds: Array.isArray(values.selectedKnowledgeBaseEntryIds)
                  ? values.selectedKnowledgeBaseEntryIds
                  : [],
              }
        )
      );
      setIsDirty(true);
      setEditingRouteKey(null);
      message.success("意图路由已更新");
    } catch {
      // 表单校验错误由 antd 接管展示
    }
  }, [editRouteForm, editingRouteKey, message, routesDraft]);

  const removeRoute = useCallback((idx: number) => {
    setRoutesDraft((prev) => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  }, []);

  const currentConfigForSubmit = useCallback(() => {
    if (!serverConfig) return null;
    return buildConfigFromDraft(serverConfig, routesDraft);
  }, [routesDraft, serverConfig]);

  const keywordsHeader = (
    <Space size={4}>
      <span>关键词</span>
      <Tooltip title="支持逗号或换行分隔多个关键词">
        <Typography.Text type="secondary" style={{ cursor: "help" }}>
          (?)
        </Typography.Text>
      </Tooltip>
    </Space>
  );

  const applyFieldErrors = useCallback(
    (errors: IntentRoutingFieldError[]) => {
      setFieldErrors(errors);
    },
    []
  );

  const runValidate = useCallback(async () => {
    const payload = currentConfigForSubmit();
    if (!payload) return false;
    // 先做前端必填兜底，再走后端结构化校验，减少无效请求。
    if (kbRequiredLocalError) {
      message.error("请先修复必填项后再校验");
      return false;
    }
    setValidating(true);
    setFieldErrors([]);
    try {
      const res = await fetch("/api/console/intent-routing/config:validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as ValidateResponse;
      const errors = Array.isArray(json.fieldErrors) ? json.fieldErrors : [];
      if (!res.ok || json.valid === false || errors.length > 0) {
        applyFieldErrors(errors);
        message.error("配置校验未通过");
        return false;
      }
      return true;
    } catch {
      message.error("网络错误，无法校验");
      return false;
    } finally {
      setValidating(false);
    }
  }, [applyFieldErrors, currentConfigForSubmit, kbRequiredLocalError, message]);

  const runSave = useCallback(async () => {
    const payload = currentConfigForSubmit();
    if (!payload) return;
    const valid = await runValidate();
    if (!valid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/console/intent-routing/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as SaveResponse;
      if (!res.ok) {
        const errors = Array.isArray(json.fieldErrors) ? json.fieldErrors : [];
        applyFieldErrors(errors);
        message.error(json.error ?? "保存失败");
        return;
      }
      message.success("配置已保存");
      if (serverConfig) {
        setServerConfig({
          ...payload,
          version: json.version ?? payload.version,
          updatedAt: json.updatedAt ?? new Date().toISOString(),
          updatedBy: json.updatedBy ?? payload.updatedBy,
        });
      }
      setIsDirty(false);
    } catch {
      message.error("网络错误，保存失败");
    } finally {
      setSaving(false);
    }
  }, [applyFieldErrors, currentConfigForSubmit, message, runValidate, serverConfig]);

  const runExecuteOnce = useCallback(async () => {
    const payload = currentConfigForSubmit();
    if (!payload) return;
    const intentId = String(executeForm.getFieldValue("debugIntentId") ?? "").trim();
    if (!intentId) {
      message.warning("请选择要调试的 intentId");
      return;
    }
    const query = String(executeForm.getFieldValue("debugQuery") ?? "").trim();
    if (!query) {
      message.warning("请输入调试 query");
      return;
    }
    setExecuting(true);
    setDebugResult(null);
    try {
      const res = await fetch("/api/console/intent-routing/execute-once", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId, query, config: payload }),
      });
      const json = (await res.json().catch(() => ({}))) as ExecuteOnceResponse;
      if (!res.ok) {
        message.error(json.error ?? "执行失败");
        return;
      }
      setDebugResult(json);
    } catch {
      message.error("网络错误，执行失败");
    } finally {
      setExecuting(false);
    }
  }, [currentConfigForSubmit, executeForm, message]);

  if (loading) {
    // 首屏仅占位，等 hydrated 后再渲染完整加载 UI，避免与旧 SSR 片段（如 antd Spin）不一致。
    if (!hydrated) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="min-h-[200px]" aria-busy="true" />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div
          className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400"
          role="status"
          aria-live="polite"
        >
          <span
            className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-400"
            aria-hidden
          />
          <span>加载配置中...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Alert
          type="error"
          showIcon
          message="加载失败"
          description={loadError}
          action={
            <Button size="small" onClick={() => void loadConfig()}>
              重试
            </Button>
          }
        />
      </div>
    );
  }

  if (!serverConfig) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <Empty description="未读取到意图配置" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {warning ? <Alert type="warning" showIcon message={warning} /> : null}
        <Card title="全局参数（只读）" size="small">
          <Space wrap>
            <Tag>意图阈值/检索参数：请在应用配置页维护</Tag>
            <Tag>version: {serverConfig.version}</Tag>
            <Tag>updatedBy: {serverConfig.updatedBy}</Tag>
          </Space>
        </Card>

        <Card
          title="意图路由配置"
          size="small"
          extra={
            <Space>
              <Button onClick={openAddRouteModal} icon={<NodeIndexOutlined />}>
                新增意图路由
              </Button>
              <Button
                onClick={() =>
                  modal.confirm({
                    title: "放弃当前更改？",
                    icon: <ExclamationCircleOutlined />,
                    content: "将丢失未保存内容",
                    onOk: () => void loadConfig(),
                  })
                }
              >
                还原
              </Button>
            </Space>
          }
        >
          <Table<RouteRow>
            rowKey="key"
            pagination={false}
            dataSource={routesDraft}
            locale={{ emptyText: "暂无路由，点击右上角“新增意图路由”" }}
            scroll={{ x: "max-content" }}
            columns={[
              {
                title: "intentId",
                dataIndex: "intentId",
                width: 160,
                render: (_, row) => <Typography.Text>{row.intentId || "-"}</Typography.Text>,
              },
              {
                title: "启用",
                dataIndex: "enabled",
                width: 60,
                render: (_, row) => (
                  <Tag color={row.enabled ? "green" : "default"}>
                    {row.enabled ? "是" : "否"}
                  </Tag>
                ),
              },
              {
                title: keywordsHeader,
                dataIndex: "keywords",
                width: 160,
                render: (_, row) => (
                  <Typography.Text>{formatKeywordsInput(row.keywords) || "-"}</Typography.Text>
                ),
              },
              {
                title: "nextNodes",
                dataIndex: "nextNodes",
                width: 200,
                render: (_, row) => (
                  <Typography.Text>{row.nextNodes.join(", ") || "-"}</Typography.Text>
                ),
              },
              {
                title: "知识库",
                dataIndex: "selectedKnowledgeBaseEntryIds",
                width: 320,
                render: (_, row) => (
                  <Typography.Text>
                    {summarizeKnowledgeLabels(row.selectedKnowledgeBaseEntryIds, knowledgeOptions)}
                  </Typography.Text>
                ),
              },
              {
                title: "操作",
                width: 132,
                fixed: "right",
                render: (_, row, idx) => (
                  <Space size={4}>
                    <Button type="link" onClick={() => openEditRouteModal(row)}>
                      修改
                    </Button>
                    <Button type="link" danger onClick={() => removeRoute(idx)}>
                      删除
                    </Button>
                  </Space>
                ),
              },
            ]}
          />

          <Divider />
          {kbRequiredLocalError ? (
            <Alert
              type="error"
              showIcon
              message={kbRequiredLocalError}
              className="mb-4"
            />
          ) : null}
        </Card>

        {fieldErrors.length > 0 ? (
          <Alert
            type="error"
            showIcon
            message="配置存在校验问题"
            description={
              <ul className="list-disc pl-4">
                {fieldErrors.map((err, idx) => (
                  <li key={`${err.field}-${idx}`}>
                    <code>{err.field}</code> - {err.message}
                  </li>
                ))}
              </ul>
            }
          />
        ) : null}

        <Card size="small">
          <Space>
            <Button icon={<ApiOutlined />} onClick={() => setDebugOpen(true)}>
              执行一次
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => void runSave()}
            >
              保存配置
            </Button>
            {isDirty ? <Tag color="gold">有未保存更改</Tag> : <Tag color="green">已保存</Tag>}
          </Space>
        </Card>
      </Space>

      <Modal
        open={addRouteOpen}
        title="新增意图路由"
        onCancel={() => setAddRouteOpen(false)}
        onOk={() => void submitAddRoute()}
        okText="确认新增"
        cancelText="取消"
        destroyOnHidden
        afterOpenChange={(open) => {
          if (!open) return;
          addRouteForm.setFieldsValue({
            intentId: "",
            enabled: true,
            keywordsText: "",
            nextNodes: ["model_request", "final_response"],
            selectedKnowledgeBaseEntryIds: [],
          });
        }}
      >
        <Form
          form={addRouteForm}
          layout="vertical"
          initialValues={{
            enabled: true,
            keywordsText: "",
            nextNodes: ["model_request", "final_response"],
            selectedKnowledgeBaseEntryIds: [],
          }}
        >
          <Form.Item
            name="intentId"
            label="intentId"
            rules={[{ required: true, message: "请输入 intentId" }]}
          >
            <Input placeholder="如: sales_after_service" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="keywordsText" label="关键词">
            <Input.TextArea rows={3} placeholder="支持逗号或换行分隔多个关键词" />
          </Form.Item>
          <Form.Item name="nextNodes" label="nextNodes">
            <Select mode="multiple" options={NODE_OPTIONS} />
          </Form.Item>
          <Form.Item name="selectedKnowledgeBaseEntryIds" label="知识库">
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              options={knowledgeOptions}
              placeholder="选择知识库文档"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(editingRouteKey)}
        title="修改意图路由"
        onCancel={() => setEditingRouteKey(null)}
        onOk={() => void submitEditRoute()}
        okText="确认修改"
        cancelText="取消"
        destroyOnHidden
        afterOpenChange={(open) => {
          if (!open || !editingRouteKey) return;
          const route = routesDraft.find((r) => r.key === editingRouteKey);
          if (!route) return;
          editRouteForm.setFieldsValue({
            intentId: route.intentId,
            enabled: route.enabled,
            keywordsText: formatKeywordsInput(route.keywords),
            nextNodes: route.nextNodes,
            selectedKnowledgeBaseEntryIds: route.selectedKnowledgeBaseEntryIds,
          });
        }}
      >
        <Form form={editRouteForm} layout="vertical">
          <Form.Item
            name="intentId"
            label="intentId"
            rules={[{ required: true, message: "请输入 intentId" }]}
          >
            <Input placeholder="如: sales_after_service" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="keywordsText" label="关键词">
            <Input.TextArea rows={3} placeholder="支持逗号或换行分隔多个关键词" />
          </Form.Item>
          <Form.Item name="nextNodes" label="nextNodes">
            <Select mode="multiple" options={NODE_OPTIONS} />
          </Form.Item>
          <Form.Item name="selectedKnowledgeBaseEntryIds" label="知识库">
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              options={knowledgeOptions}
              placeholder="选择知识库文档"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={debugOpen}
        onOk={() => setDebugOpen(false)}
        onCancel={() => setDebugOpen(false)}
        title="执行一次结果"
        width={760}
        footer={[
          <Button key="run" type="primary" loading={executing} onClick={() => void runExecuteOnce()}>
            执行一次
          </Button>,
          <Button key="ok" type="primary" onClick={() => setDebugOpen(false)}>
            确定
          </Button>,
        ]}
      >
        <Form form={executeForm} layout="vertical" initialValues={{ debugIntentId: "", debugQuery: "" }}>
          <Row gutter={16}>
            <Col xs={24} lg={8}>
              <Form.Item name="debugIntentId" label="目标 intentId">
                <Select
                  allowClear
                  placeholder="请选择一个 intentId"
                  options={routesDraft
                    .map((route) => route.intentId.trim())
                    .filter(Boolean)
                    .map((intentId) => ({ label: intentId, value: intentId }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={16}>
              <Form.Item name="debugQuery" label="调试 query">
                <Input placeholder="输入一条测试 query，例如：退款流程怎么走？" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {debugResult ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Text>
              intentHit: <b>{String(Boolean(debugResult.intentHit))}</b>
            </Typography.Text>
            <Typography.Text>
              fallbackReason: <b>{debugResult.fallbackReason ?? "none"}</b>
            </Typography.Text>
            <Typography.Paragraph copyable className="!mb-0">
              {debugResult.finalAnswer ?? "(无最终回答)"}
            </Typography.Paragraph>
            <Table
              size="small"
              rowKey={(row) => `${row.nodeId}-${row.nodeType}`}
              pagination={false}
              dataSource={Array.isArray(debugResult.traces) ? debugResult.traces : []}
              columns={[
                { title: "nodeId", dataIndex: "nodeId" },
                { title: "nodeType", dataIndex: "nodeType" },
                { title: "status", dataIndex: "status" },
                { title: "durationMs", dataIndex: "durationMs" },
              ]}
            />
          </Space>
        ) : null}
      </Modal>
    </div>
  );
}
