import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/history",
  "/generate",
  "/templates",
  "/profile",
  "/credits",
  "/regulations",
  "/chat",
  "/onboarding",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Check if the current route is protected
  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check onboarding status
      const isOnboardingRoute = request.nextUrl.pathname.startsWith("/onboarding");
      const hasOnboardedCookie = request.cookies.get("consentgen_onboarded")?.value === "1";

      if (!isOnboardingRoute && !hasOnboardedCookie) {
        // Query profile to see if clinician details are already filled
        const { data: profile } = await supabase
          .from("profiles")
          .select("doctor_name, doctor_registration_no")
          .eq("id", user.id)
          .single();

        if (!profile || !profile.doctor_name || !profile.doctor_registration_no) {
          const onboardingUrl = new URL("/onboarding", request.url);
          return NextResponse.redirect(onboardingUrl);
        } else {
          // Cache verified onboarding in cookie for fast subsequent checks
          response.cookies.set({
            name: "consentgen_onboarded",
            value: "1",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            sameSite: "lax",
          });
        }
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
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
