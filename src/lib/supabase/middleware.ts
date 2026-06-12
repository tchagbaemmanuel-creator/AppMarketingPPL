import { NextResponse, type NextRequest } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/register", "/admin/approve"];

export async function updateSession(request: NextRequest) {
  const userId = await getSessionUserIdFromRequest(request);
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthCallback = pathname.startsWith("/auth/callback");

  if (!userId && !isPublic && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (userId && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
