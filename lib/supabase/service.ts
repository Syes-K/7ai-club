import { createClient } from "@supabase/supabase-js";

export function getServiceClientConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_URL is not set.";
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return "SUPABASE_SERVICE_ROLE_KEY is not set. Add it from Supabase Dashboard → Settings → API → service_role, then restart the dev server.";
  }

  return null;
}

export function createServiceClient() {
  const configError = getServiceClientConfigError();
  if (configError) {
    throw new Error(configError);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
