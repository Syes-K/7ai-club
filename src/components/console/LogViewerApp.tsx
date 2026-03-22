"use client";

import {
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProTable,
  QueryFilter,
} from "@ant-design/pro-components";
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from "@ant-design/pro-components";
import { CopyOutlined } from "@ant-design/icons";
import { App, Button, Space, Tag, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/zh-cn";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UNSET_LEVEL_SENTINEL } from "@/lib/logs/chat-log-types";
import { fieldLabelZh } from "@/lib/logs/log-field-labels";
import { LogDetailDrawer } from "./LogDetailDrawer";

dayjs.locale("zh-cn");

type LogQueryResponse = {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  scanTruncated: boolean;
  scannedLines: number;
};

type FacetsResponse = {
  levels: string[];
  events: string[];
  scanTruncated: boolean;
  scannedLines: number;
};

type CommittedFilters = {
  /** 日历日 YYYY-MM-DD，与 API `date` 一致；由服务端按服务器本地时区解释 */
  dateStr: string;
  /** `null`：当日全天；`0`～`23`：该整点小时（服务器本地） */
  hour: number | null;
  levels: string[];
  events: string[];
  requestId: string;
  keyword: string;
};

function defaultDateStr(): string {
  return dayjs().format("YYYY-MM-DD");
}

function committedDefaultsForDate(dateStr: string): CommittedFilters {
  return {
    dateStr,
    hour: null,
    levels: [],
    events: [],
    requestId: "",
    keyword: "",
  };
}

function formValueToDateStr(logDate: unknown): string {
  if (logDate == null || (typeof logDate === "string" && logDate.trim() === "")) {
    return defaultDateStr();
  }
  const parsed = dayjs(logDate as Parameters<typeof dayjs>[0]);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : defaultDateStr();
}

/** 与日志 ts（UTC ISO）一致，固定 UTC + zh-CN，避免 SSR 与浏览器 locale/时区导致水合不一致 */
const TS_CELL_UTC = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatTsCell(ts: unknown): string {
  if (typeof ts !== "string" || !ts.trim()) return "—";
  const ms = Date.parse(ts);
  if (!Number.isFinite(ms)) return "无效时间";
  return TS_CELL_UTC.format(ms);
}

const LEVEL_OPTIONS = [
  { label: "info", value: "info" },
  { label: "warn", value: "warn" },
  { label: "error", value: "error" },
  { label: "未标注", value: UNSET_LEVEL_SENTINEL },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  label: `${String(i).padStart(2, "0")}:00`,
  value: i,
}));

function buildParams(c: CommittedFilters, p: number, ps: number) {
  const d = c.dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const params = new URLSearchParams();
  params.set("date", d);
  if (c.hour !== null) params.set("hour", String(c.hour));
  for (const lv of c.levels) {
    params.append("level", lv);
  }
  for (const ev of c.events) {
    if (ev.trim()) params.append("event", ev.trim());
  }
  if (c.requestId.trim()) params.set("requestId", c.requestId.trim());
  if (c.keyword.trim()) params.set("keyword", c.keyword.trim());
  params.set("page", String(p));
  params.set("pageSize", String(ps));
  return params;
}

function committedFromForm(values: {
  logDate?: Dayjs | string | Date;
  logHour?: number | null;
  levels?: string[];
  events?: string[];
  requestId?: string;
  keyword?: string;
}): CommittedFilters {
  const dateStr = formValueToDateStr(values.logDate);

  let hour: number | null = null;
  const rawH = values.logHour;
  if (rawH !== undefined && rawH !== null) {
    const h = typeof rawH === "number" ? rawH : Number(rawH);
    if (Number.isInteger(h) && h >= 0 && h <= 23) hour = h;
  }

  return {
    dateStr,
    hour,
    levels: Array.isArray(values.levels) ? values.levels : [],
    events: Array.isArray(values.events) ? values.events : [],
    requestId: typeof values.requestId === "string" ? values.requestId : "",
    keyword: typeof values.keyword === "string" ? values.keyword : "",
  };
}

export function LogViewerApp({
  initialDateStr,
}: {
  /** 由服务端页面传入的默认日历日，保证 SSR 与水合时与表单 initialValues 一致 */
  initialDateStr: string;
}) {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const filterFormRef = useRef<ProFormInstance>(null);
  const committedRef = useRef<CommittedFilters>(
    committedDefaultsForDate(initialDateStr)
  );
  const [queryVersion, setQueryVersion] = useState(1);
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<Record<
    string,
    unknown
  > | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [tableMeta, setTableMeta] = useState<{
    scanTruncated: boolean;
    scannedLines: number;
  } | null>(null);

  const fetchFacetsFor = useCallback(async (c: CommittedFilters) => {
    const d = c.dateStr.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    const u = new URL("/api/console/logs/facets", window.location.origin);
    u.searchParams.set("date", d);
    if (c.hour !== null) u.searchParams.set("hour", String(c.hour));
    const res = await fetch(u.toString());
    if (!res.ok) return;
    const j = (await res.json()) as FacetsResponse;
    setFacets(j);
  }, []);

  useEffect(() => {
    void fetchFacetsFor(committedRef.current);
  }, [queryVersion, fetchFacetsFor]);

  const bumpQuery = useCallback(() => {
    setQueryVersion((v) => v + 1);
  }, []);

  const eventOptions = useMemo(
    () =>
      (facets?.events ?? []).map((e) => ({
        label: e,
        value: e,
      })),
    [facets?.events]
  );

  const columns: ProColumns<Record<string, unknown>>[] = useMemo(
    () => [
      {
        title: fieldLabelZh("ts"),
        dataIndex: "ts",
        width: 160,
        ellipsis: true,
        search: false,
        render: (_, row) => formatTsCell(row.ts),
      },
      {
        title: fieldLabelZh("level"),
        dataIndex: "level",
        width: 100,
        search: false,
        render: (_, row) => {
          const level =
            typeof row.level === "string" && row.level ? row.level : null;
          if (!level) return "—";
          const color =
            level === "error"
              ? "red"
              : level === "warn"
                ? "orange"
                : level === "info"
                  ? "blue"
                  : "default";
          return <Tag color={color}>{level}</Tag>;
        },
      },
      {
        title: fieldLabelZh("event"),
        dataIndex: "event",
        width: 180,
        ellipsis: true,
        search: false,
        render: (_, row) =>
          typeof row.event === "string" ? row.event : "—",
      },
      {
        title: fieldLabelZh("requestId"),
        dataIndex: "requestId",
        ellipsis: true,
        search: false,
        render: (_, row) => {
          const rid =
            typeof row.requestId === "string" ? row.requestId : "";
          if (!rid) return "—";
          return (
            <Space size={4}>
              <Typography.Text
                copyable={{ text: rid, icon: <CopyOutlined /> }}
                ellipsis={{ tooltip: rid }}
              >
                {rid}
              </Typography.Text>
            </Space>
          );
        },
      },
      {
        title: fieldLabelZh("provider"),
        dataIndex: "provider",
        width: 100,
        search: false,
        responsive: ["md"],
        render: (_, row) =>
          typeof row.provider === "string" ? row.provider : "—",
      },
      {
        title: fieldLabelZh("model"),
        dataIndex: "model",
        width: 120,
        search: false,
        responsive: ["lg"],
        render: (_, row) =>
          typeof row.model === "string" ? row.model : "—",
      },
      {
        title: "操作",
        valueType: "option",
        width: 80,
        search: false,
        render: (_, row) => [
          <Button
            key="view"
            type="link"
            size="small"
            onClick={(e) => {
              returnFocusRef.current = e.currentTarget;
              setDrawerRecord(row);
              setDrawerOpen(true);
            }}
          >
            查看
          </Button>,
        ],
      },
    ],
    []
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Typography.Paragraph type="secondary" className="!mb-4 text-xs">
        日期、小时由服务端按服务器本地时区解释，与落盘文件{" "}
        <Typography.Text code>YYYY-MM-DD-HH.log</Typography.Text>{" "}
        一致；小时不选则查该日全天，选了则该整点小时。每条日志的{" "}
        <Typography.Text code>ts</Typography.Text> 为 UTC；表格「时间」列按{" "}
        <Typography.Text code>UTC</Typography.Text> 展示以便 SSR 与水合一致。多个 event
        为「或」，与 level、时间、requestId、关键词为「且」。请点「查询」提交。
      </Typography.Paragraph>

      <QueryFilter<{
        logDate: Dayjs;
        logHour?: number | null;
        levels?: string[];
        events?: string[];
        requestId?: string;
        keyword?: string;
      }>
        defaultCollapsed={false}
        labelWidth={112}
        initialValues={{
          logDate: dayjs(initialDateStr, "YYYY-MM-DD"),
          logHour: undefined,
          levels: [],
          events: [],
          requestId: "",
          keyword: "",
        }}
        formRef={filterFormRef}
        onFinish={async (values) => {
          committedRef.current = committedFromForm(values);
          bumpQuery();
          // ProTable 在部分环境下不会因 params 变化自动触发 request，需显式拉数
          void actionRef.current?.reload(true);
          return true;
        }}
        onReset={() => {
          const d = committedDefaultsForDate(defaultDateStr());
          committedRef.current = d;
          filterFormRef.current?.setFieldsValue({
            logDate: dayjs(d.dateStr, "YYYY-MM-DD"),
            logHour: undefined,
            levels: [],
            events: [],
            requestId: "",
            keyword: "",
          });
          bumpQuery();
          void actionRef.current?.reload(true);
        }}
        submitter={{
          searchConfig: { submitText: "查询" },
          resetButtonProps: { children: "重置并查询" },
        }}
      >
        <ProFormDatePicker
          name="logDate"
          label="日期"
          rules={[{ required: true, message: "请选择日期" }]}
          fieldProps={{
            format: "YYYY-MM-DD",
            style: { width: "100%" },
          }}
        />
        <ProFormSelect
          name="logHour"
          label="小时"
          placeholder="不选表示当天全天"
          allowClear
          options={HOUR_OPTIONS}
        />
        <ProFormSelect
          name="levels"
          label={fieldLabelZh("level")}
          mode="multiple"
          placeholder="不选表示不限"
          options={LEVEL_OPTIONS}
        />
        <ProFormSelect
          name="events"
          label={fieldLabelZh("event")}
          mode="tags"
          placeholder="可选列表或手动输入，多值为「或」"
          fieldProps={{
            options: eventOptions,
            tokenSeparators: [","],
          }}
        />
        <ProFormText
          name="requestId"
          label={fieldLabelZh("requestId")}
          placeholder="前缀匹配"
          fieldProps={{ style: { fontFamily: "monospace" } }}
        />
        <ProFormText
          name="keyword"
          label={fieldLabelZh("keyword")}
          placeholder="整行 JSON 子串"
        />
      </QueryFilter>

      <ProTable<Record<string, unknown>>
        size="small"
        bordered={true}
        actionRef={actionRef}
        rowKey={(record) => `${String(record.ts)}-${record.requestId}-${record.event}`}
        search={false}
        params={{ queryVersion }}
        columns={columns}
        options={false}
        pagination={{
          defaultPageSize: 20,
          pageSizeOptions: [20, 50, 100],
          showSizeChanger: true,
        }}
        toolBarRender={() => [
          tableMeta ? (
            <Typography.Text key="meta" type="secondary" className="text-xs">
              已扫行 {tableMeta.scannedLines}
              {tableMeta.scanTruncated ? "（已达扫描上限，结果可能不全）" : ""}
            </Typography.Text>
          ) : null,
        ]}
        request={async (params) => {
          const c = committedRef.current;
          const p = buildParams(
            c,
            params.current ?? 1,
            params.pageSize ?? 20
          );
          if (!p) {
            message.error("日期格式无效");
            return { data: [], success: false, total: 0 };
          }
          try {
            const u = new URL("/api/console/logs", window.location.origin);
            u.search = p.toString();
            const res = await fetch(u.toString());
            const j = (await res.json().catch(() => ({}))) as LogQueryResponse & {
              error?: string;
              code?: string;
            };
            if (!res.ok) {
              message.error(
                typeof j.error === "string" ? j.error : "暂时无法读取日志"
              );
              setTableMeta(null);
              return { data: [], success: false, total: 0 };
            }
            const data: LogQueryResponse = {
              items: Array.isArray(j.items) ? j.items : [],
              total: typeof j.total === "number" ? j.total : 0,
              page: typeof j.page === "number" ? j.page : params.current ?? 1,
              pageSize:
                typeof j.pageSize === "number"
                  ? j.pageSize
                  : params.pageSize ?? 20,
              scanTruncated: Boolean(j.scanTruncated),
              scannedLines:
                typeof j.scannedLines === "number" ? j.scannedLines : 0,
            };
            setTableMeta({
              scanTruncated: data.scanTruncated,
              scannedLines: data.scannedLines,
            });
            return {
              data: data.items,
              success: true,
              total: data.total,
            };
          } catch {
            message.error("网络错误");
            setTableMeta(null);
            return { data: [], success: false, total: 0 };
          }
        }}
        onRow={(record) => ({
          onClick: (e) => {
            const el = e.target as HTMLElement;
            if (el.closest("button,a,.ant-typography-copy")) return;
            setDrawerRecord(record);
            setDrawerOpen(true);
          },
          style: { cursor: "pointer" },
        })}
      />

      <LogDetailDrawer
        open={drawerOpen}
        record={drawerRecord}
        onClose={() => setDrawerOpen(false)}
        returnFocusRef={returnFocusRef}
      />
    </div>
  );
}
