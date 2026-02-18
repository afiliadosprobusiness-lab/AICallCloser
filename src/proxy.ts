import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const superAdminOnlyPath = "/super-admin";
const superAdminBlockedPaths = ["/dashboard", "/leads", "/calls", "/agent", "/settings"];

function matchesPath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const touchesSuperAdminRoute = matchesPath(pathname, superAdminOnlyPath);
  const touchesBlockedRoute = superAdminBlockedPaths.some((path) => matchesPath(pathname, path));

  if (!touchesSuperAdminRoute && !touchesBlockedRoute) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.next();
  }

  const isSuperAdmin = Boolean(token.isSuperAdmin);

  if (touchesBlockedRoute && isSuperAdmin) {
    return NextResponse.redirect(new URL(superAdminOnlyPath, request.url));
  }

  if (touchesSuperAdminRoute && !isSuperAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/calls/:path*",
    "/agent/:path*",
    "/settings/:path*",
    "/super-admin/:path*",
  ],
};
