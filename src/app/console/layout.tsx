import { ConsoleProShell } from "@/components/console/ConsoleProShell";
import { ConsoleAntdProvider } from "./ConsoleAntdProvider";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConsoleAntdProvider>
      <ConsoleProShell>{children}</ConsoleProShell>
    </ConsoleAntdProvider>
  );
}
