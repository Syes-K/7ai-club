export const dynamic = "force-dynamic";

import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#0F0F23] px-4">
      <AuthForm mode="register" />
    </main>
  );
}
