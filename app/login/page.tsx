export const dynamic = "force-dynamic";

import { AuthForm } from "@/components/auth/auth-form";
import { ACCOUNT_DISABLED_MESSAGE } from "@/lib/auth/ban";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const initialError =
    error === "account_disabled" ? ACCOUNT_DISABLED_MESSAGE : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg-base)] px-4">
      <AuthForm mode="login" next={next} initialError={initialError} />
    </main>
  );
}
