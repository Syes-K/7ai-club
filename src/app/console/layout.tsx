import { ConsoleChrome } from "@/components/console/ConsoleChrome";
import { ConsoleAntdProvider } from "./ConsoleAntdProvider";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsoleAntdProvider>
      <div className="flex min-h-[100dvh] flex-col bg-zinc-50 dark:bg-zinc-950">
        <ConsoleChrome />
        {children}
      </div>
    </ConsoleAntdProvider>
  );
}
