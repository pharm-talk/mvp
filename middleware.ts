import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/auth");
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isPharmacistPage = pathname.startsWith("/pharmacist");

  // 비로그인 → 로그인 페이지로
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 로그인 상태 → 로그인 페이지 접근 차단
  if (user && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 로그인 상태 → 온보딩 + 역할 체크
  if (user && !isAuthPage && !isOnboardingPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, role")
      .eq("id", user.id)
      .single();

    // 온보딩 미완료 → 온보딩으로
    if (!profile || !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // TODO: 프로덕션에서 활성화
    // // 약사가 일반 유저 페이지 접근 → 약사 대시보드로
    // if (profile.role === "pharmacist" && !isPharmacistPage) {
    //   const url = request.nextUrl.clone();
    //   url.pathname = "/pharmacist";
    //   return NextResponse.redirect(url);
    // }
    //
    // // 일반 유저가 약사 페이지 접근 → 홈으로
    // if (profile.role !== "pharmacist" && isPharmacistPage) {
    //   const url = request.nextUrl.clone();
    //   url.pathname = "/";
    //   return NextResponse.redirect(url);
    // }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
