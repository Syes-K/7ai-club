export const dynamic = "force-dynamic";

import { AuthForm } from "@/components/auth/auth-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--bg-base)] px-4">
      <AuthForm mode="register" next={next} />
    </main>
  );
}
