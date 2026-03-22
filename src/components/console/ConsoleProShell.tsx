"use client";

import { FileSearchOutlined, SettingOutlined } from "@ant-design/icons";
import { PageContainer, ProLayout } from "@ant-design/pro-components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const PAGE_TITLE: Record<string, string> = {
  "/console": "应用配置",
  "/console/logs": "日志",
};

export function ConsoleProShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  /** ProLayout 用 useBreakpoint 生成 `screen-*` 等 class，SSR 与首屏客户端不一致会 hydration mismatch */
  const [layoutReady, setLayoutReady] = useState(false);
  useEffect(() => {
    setLayoutReady(true);
  }, []);

  const route = useMemo(
    () => ({
      path: "/",
      routes: [
        {
          path: "/console",
          name: "应用配置",
          icon: <SettingOutlined />,
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

  const pageTitle = PAGE_TITLE[pathname] ?? "";

  if (!layoutReady) {
    return (
      <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">{children}</div>
    );
  }

  return (
    <div className="min-h-[100dvh]">
      <ProLayout
        enableDarkTheme={true}
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
            href="/"
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
