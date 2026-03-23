import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "./src/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/logout")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_session")?.value;
  const session = token ? await verifyAdminSession(token) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
