import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith("/login");
  const isApi = pathname.startsWith("/api");

  // Bypass static assets and internal requests
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // Quick check: inspect cookies
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.includes("auth-token") || c.name.startsWith("sb-")
  );

  // If on login page and NO auth cookie, let user access login instantly without network calls
  if (isLoginPage && !hasAuthCookie) {
    return response;
  }

  // If on protected page and NO auth cookie, redirect immediately to login
  if (!isLoginPage && !isApi && !hasAuthCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  try {
    // Wrap Supabase calls with a strict 3.5s timeout to prevent ECONNRESET hangs
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase auth timeout")), 3500)
    );

    const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);

    if (!user && !isLoginPage && !isApi) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user) {
      const profilePromise = supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const profileTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase profile timeout")), 3500)
      );

      const { data: profile } = await Promise.race([profilePromise, profileTimeout]);
      const isAdmin = profile?.role === "admin";

      if (!isAdmin && !isLoginPage && !isApi) {
        await supabase.auth.signOut().catch(() => {});
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("error", "unauthorized_admin");
        return NextResponse.redirect(loginUrl);
      }

      if (isAdmin && isLoginPage) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  } catch (err) {
    console.warn("Proxy auth check skipped or timed out:", err);
    if (!isLoginPage && !isApi) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
