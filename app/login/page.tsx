export const dynamic = "force-dynamic";

import { AuthForm } from "@/components/auth/auth-form";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg-base)] px-4">
      <AuthForm mode="login" next={next} />
    </main>
  );
}
