"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getEmailRedirectTo } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "register";

export function AuthForm({ mode, next }: { mode: AuthMode; next?: string }) {
  const router = useRouter();
  const redirectTo = next?.startsWith("/") ? next : "/chat";
  const submittingRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const isLogin = mode === "login";
  const switchHref = isLogin ? "/register" : "/login";
  const switchHrefWithNext =
    next?.startsWith("/") ? `${switchHref}?next=${encodeURIComponent(next)}` : switchHref;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || cooldown > 0 || submittingRef.current) return;

    setError(null);
    setInfo(null);
    setLoading(true);
    submittingRef.current = true;

    try {
      const supabase = createClient();
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Uses current origin so prod emails never point at localhost (also whitelist in Supabase).
            emailRedirectTo: getEmailRedirectTo(redirectTo),
          },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setInfo(
            "Account created. If email confirmation is enabled, check your inbox and confirm before signing in.",
          );
          return;
        }
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      const authError = err as { message?: string; code?: string };
      setError(getAuthErrorMessage(authError));
      if (authError.code === "over_email_send_rate_limit") {
        setCooldown(60);
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {isLogin ? "Sign in to 7ai-club" : "Create your 7ai-club account"}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {isLogin
            ? "Sign in with email to start chatting"
            : "Create an account to chat with your AI assistant"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {info && (
          <p className="text-sm text-[var(--accent-success)]" role="status">
            {info}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || cooldown > 0}
        >
          {loading
            ? "Please wait…"
            : cooldown > 0
              ? `Wait ${cooldown}s`
              : isLogin
                ? "Sign in"
                : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-sm text-[var(--text-muted)]">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        <Link
          href={switchHrefWithNext}
          className="ml-1 text-[var(--neon-primary)] hover:underline cursor-pointer"
        >
          {isLogin ? "Sign up" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
