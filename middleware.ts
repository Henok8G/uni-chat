import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PATHS = [
  "/payment",
  "/app",
  "/settings",
  "/admin",
  "/profile",
  "/home",
  "/match",
];

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("ethi_uni_chat_session");
  if (!sessionCookie?.value) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const secret = getSecretKey();
  if (!secret) {
    // Fail-closed: cannot verify authenticity without secret
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.set("ethi_uni_chat_session", "", { maxAge: 0, path: "/" });
    return response;
  }

  try {
    await jwtVerify(sessionCookie.value, secret);
  } catch {
    // Invalid/expired token -> clear cookie & redirect to login
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.set("ethi_uni_chat_session", "", { maxAge: 0, path: "/" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/payment/:path*",
    "/app/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/home/:path*",
    "/match/:path*",
  ],
};


