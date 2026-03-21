"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TITLE: Record<string, string> = {
  "/console": "应用配置",
  "/console/logs": "日志",
};

export function ConsoleChrome() {
  const path = usePathname() ?? "";
  const title = TITLE[path] ?? "Console";

  const navClass = (active: boolean) =>
    [
      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
    ].join(" ");

  return (
    <>
      <header className="shrink-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
          <Link
            href="/"
            className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            返回对话
          </Link>
        </div>
        <nav
          className="mx-auto mt-3 flex max-w-7xl flex-wrap gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800"
          aria-label="Console 子导航"
        >
          <Link href="/console" className={navClass(path === "/console")}>
            应用配置
          </Link>
          <Link href="/console/logs" className={navClass(path === "/console/logs")}>
            日志
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-3">
        <div
          className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
        >
          注意：Console 无登录验证，配置与日志可能含敏感信息；请勿将 /console
          暴露到公网，建议仅内网或通过网关鉴权后访问。
        </div>
      </div>
    </>
  );
}
