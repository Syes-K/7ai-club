export const dynamic = "force-dynamic";

import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg-base)] px-4">
      <AuthForm mode="register" />
    </main>
  );
}
