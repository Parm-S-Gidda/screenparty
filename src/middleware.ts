import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, skip auth and let requests through.
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable — fail open, protected routes will handle auth.
    return response;
  }

  const path = request.nextUrl.pathname;

  // Block signup entirely
  if (path.startsWith("/signup")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Block any authenticated user who isn't the allowed email
  const allowedEmail = process.env.ALLOWED_EMAIL;
  if (user && allowedEmail && user.email !== allowedEmail) {
    await supabase.auth.signOut();
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "not_authorized");
    return NextResponse.redirect(url);
  }

  const needsAuth = path.startsWith("/dashboard") || path.startsWith("/host");
  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
