import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";

const protectedRoutes = ["/dashboard", "/board", "/backlog", "/reports", "/settings"];

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // If user is authenticated and tries to access login/signup, redirect to dashboard
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not authenticated and tries to access a protected route, redirect to login
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - marketing page assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
