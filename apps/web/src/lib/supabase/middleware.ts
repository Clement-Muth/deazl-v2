import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/auth/");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isPublicRoute = pathname.startsWith("/r/");
  const isLandingPage = pathname === "/";
  const isLegalPage = pathname.startsWith("/confidentialite") || pathname.startsWith("/conditions") || pathname.startsWith("/mentions-legales") || pathname.startsWith("/rgpd") || pathname.startsWith("/securite") || pathname === "/roadmap";

  if (!user && !isAuthRoute && !isOnboardingRoute && !isPublicRoute && !isLandingPage && !isLegalPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && !user.user_metadata?.onboarding_completed && !isOnboardingRoute && !isAuthRoute && !isPublicRoute && !isLandingPage && !isLegalPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding/welcome";
    return NextResponse.redirect(url);
  }

  if (user && user.user_metadata?.onboarding_completed && isOnboardingRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/planning";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
