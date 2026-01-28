import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/forgot-password", "/auth/callback"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user exists, check their profile
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_complete, is_banned")
      .eq("id", user.id)
      .single();

    // If banned, redirect to banned page
    if (profile?.is_banned) {
      if (pathname !== "/banned") {
        const url = request.nextUrl.clone();
        url.pathname = "/banned";
        return NextResponse.redirect(url);
      }
    }

    // If onboarding not complete, redirect to onboarding (unless already there)
    const isOnboardingRoute = pathname.startsWith("/onboarding");
    if (profile && !profile.onboarding_complete && !isOnboardingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding/welcome";
      return NextResponse.redirect(url);
    }

    // If onboarding complete and trying to access onboarding, redirect to home
    if (profile?.onboarding_complete && isOnboardingRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // If user is logged in and trying to access auth pages, redirect to home
  if (user && isPublicRoute && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
