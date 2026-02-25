import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    if (!token) {
      const signIn = new URL("/login", request.url);
      signIn.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(signIn);
    }
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (
    path.startsWith("/account") ||
    path.startsWith("/checkout") ||
    path.includes("/subscribe") ||
    path.startsWith("/subscriptions")
  ) {
    if (!token) {
      const signIn = new URL("/login", request.url);
      signIn.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(signIn);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};
