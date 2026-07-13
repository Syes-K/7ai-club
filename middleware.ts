import { type NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin/auth";
import { ACCOUNT_DISABLED_MESSAGE } from "@/lib/auth/ban";
import {
  AccountDisabledError,
  ensureUserNotBanned,
  isUserAppPath,
} from "@/lib/auth/session";
import { updateSession } from "@/lib/supabase/middleware";

async function redirectDisabledUser(request: NextRequest) {
  const login = new URL("/login", request.url);
  login.searchParams.set("error", "account_disabled");
  return NextResponse.redirect(login);
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (user && isUserAppPath(pathname)) {
    try {
      await ensureUserNotBanned(user.id, supabase);
    } catch (error) {
      if (error instanceof AccountDisabledError) {
        if (pathname.startsWith("/api/")) {
          return new NextResponse(ACCOUNT_DISABLED_MESSAGE, { status: 403 });
        }
        return redirectDisabledUser(request);
      }
      throw error;
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (!isAdminEmail(user.email)) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
  }

  if (pathname.startsWith("/chat") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/console") && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" || pathname === "/register") && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/chat/:path*",
    "/console/:path*",
    "/admin/:path*",
    "/api/chat",
    "/api/chat/:path*",
    "/api/models",
    "/api/models/:path*",
    "/api/knowledge",
    "/api/knowledge/:path*",
    "/login",
    "/register",
    "/auth/callback",
  ],
};
