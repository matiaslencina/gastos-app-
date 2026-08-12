import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "session";

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;

  if (cookie && cookie === process.env.AUTH_SECRET) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!login|api/login|_next/static|_next/image|favicon.ico).*)",
  ],
};
