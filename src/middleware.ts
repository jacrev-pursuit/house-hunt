import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "hh_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  // Allow public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/manifest") || pathname.startsWith("/icon")) {
    return response;
  }

  const session = request.cookies.get(COOKIE_NAME);
  if (!session?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
