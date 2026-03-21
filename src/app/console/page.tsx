import Link from "next/link";
import { readAppConfigWithMeta } from "@/lib/config";
import { ConsoleConfigForm } from "@/components/console/ConsoleConfigForm";

export const dynamic = "force-dynamic";

export default function ConsolePage() {
  const { config, warning } = readAppConfigWithMeta();

  return (
    <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            应用配置
          </h1>
          <Link
            href="/"
            className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            返回对话
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-3">
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          注意：本页无登录验证，请勿将 /console 暴露到公网；建议仅内网或通过网关鉴权后访问。
        </div>
      </div>

      <ConsoleConfigForm
        initialConfig={config}
        initialFileWarning={warning}
      />
    </div>
  );
}
