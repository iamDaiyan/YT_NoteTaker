import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const loggedIn = Boolean(req.auth);
  const pathname = req.nextUrl.pathname;
  const isLogin = pathname === "/login";

  if (!loggedIn && !isLogin) {
    const u = new URL("/login", req.url);
    u.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(u);
  }

  if (loggedIn && isLogin) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Only routes that ship UI; skips /api, /_next, and hashed assets entirely.
  matcher: ["/", "/login"],
};
