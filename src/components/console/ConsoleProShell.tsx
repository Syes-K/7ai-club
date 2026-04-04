"use client";

import {
  BookOutlined,
  CommentOutlined,
  FileSearchOutlined,
  NodeIndexOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { PageContainer, ProLayout } from "@ant-design/pro-components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore, type ReactNode } from "react";

/** ProLayout 依赖客户端 breakpoint；SSR 为 false，hydrate 后为 true，避免 effect 内同步 setState。 */
function useIsClient() {
  return useSyncExternalStore(
    () => () => {
      /* no store */
    },
    () => true,
    () => false
  );
}

const PAGE_TITLE: Record<string, string> = {
  "/console": "应用配置",
  "/console/prompts": "提示词管理",
  "/console/logs": "日志",
  "/console/knowledge": "知识库",
  "/console/intent-routing/config": "意图配置",
};

export function ConsoleProShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  /** ProLayout 用 useBreakpoint 生成 `screen-*` 等 class，SSR 与首屏客户端不一致会 hydration mismatch */
  const layoutReady = useIsClient();

  const route = useMemo(
    () => ({
      path: "/chat",
      routes: [
        {
          path: "/console",
          name: "应用配置",
          icon: <SettingOutlined />,
        },
        {
          path: "/console/prompts",
          name: "提示词管理",
          icon: <CommentOutlined />,
        },
        {
          path: "/console/knowledge",
          name: "知识库",
          icon: <BookOutlined />,
        },
        {
          path: "/console/intent-routing/config",
          name: "意图配置",
          icon: <NodeIndexOutlined />,
        },
        {
          path: "/console/logs",
          name: "日志",
          icon: <FileSearchOutlined />,
        },
      ],
    }),
    []
  );

  const pageTitle =
    pathname.startsWith("/console/knowledge/") && pathname !== "/console/knowledge"
      ? "知识库详情"
      : (PAGE_TITLE[pathname] ?? "");

  if (!layoutReady) {
    return (
      <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">{children}</div>
    );
  }

  return (
    <div className="min-h-[100dvh]">
      <ProLayout
        layout="mix"
        title="后台管理"
        logo={false}
        route={route}
        location={{ pathname }}
        menuItemRender={(item, defaultDom) => {
          if (!item.path || item.isUrl) return defaultDom;
          return <Link href={item.path}>{defaultDom}</Link>;
        }}
        actionsRender={() => [
          <Link
            key="back-chat"
            href="/chat"
            className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            返回对话
          </Link>,
        ]}
        footerRender={false}
        contentStyle={{
          minHeight: "calc(100dvh - 56px)",
        }}
        pageTitleRender={() =>
          pageTitle ? `${pageTitle} · 后台管理` : "后台管理"
        }
      >
        <PageContainer title={pageTitle || false} breadcrumbRender={false}>
          <div className="bg-zinc-50 dark:bg-zinc-950">{children}</div>
        </PageContainer>
      </ProLayout>
    </div>
  );
}
