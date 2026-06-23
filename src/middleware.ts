import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, gateToken } from "@/lib/auth";

/**
 * Whole-site access gate. If ACCESS_PASSWORD is set, every route requires a valid
 * gate cookie; otherwise the gate is disabled (e.g. local dev without the env).
 * /login and the auth endpoints stay open so the user can sign in.
 */
export async function middleware(req: NextRequest) {
  const password = process.env.ACCESS_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(GATE_COOKIE)?.value;
  const expected = await gateToken(password);
  if (cookie && cookie === expected) return NextResponse.next();

  // API calls get a clean 401; page requests are redirected to the login screen
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Требуется вход." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // run on everything except Next internals and the favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
