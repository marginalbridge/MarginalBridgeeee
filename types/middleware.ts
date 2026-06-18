import { verifySessionToken } from "@/lib/session";

import { NextRequest, NextResponse } from "next/server";



const SESSION_COOKIE = "mb_session";



function sessionCookieOptions() {

  return {

    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax" as const,

    path: "/",

  };

}



function clearSessionCookie(response: NextResponse): void {

  response.cookies.set(SESSION_COOKIE, "", {

    ...sessionCookieOptions(),

    maxAge: 0,

  });

}



export async function middleware(request: NextRequest) {

  const { pathname } = request.nextUrl;



  if (

    pathname.startsWith("/api/") ||

    pathname.startsWith("/_next/") ||

    pathname.includes(".")

  ) {

    return NextResponse.next();

  }



  const rawToken = request.cookies.get(SESSION_COOKIE)?.value;

  const session = await verifySessionToken(rawToken);

  const hasStaleCookie = Boolean(rawToken) && !session;



  const isProtected =

    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const isLoggedIn = session !== null;



  if (isProtected && !isLoggedIn) {

    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("redirect", pathname);

    const response = NextResponse.redirect(loginUrl);

    if (hasStaleCookie) clearSessionCookie(response);

    return response;

  }



  if (isAuthPage && isLoggedIn) {

    return NextResponse.redirect(new URL("/dashboard", request.url));

  }



  if (hasStaleCookie && isAuthPage) {

    const response = NextResponse.next();

    clearSessionCookie(response);

    return response;

  }



  return NextResponse.next();

}



export const config = {

  matcher: [

    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",

  ],

};


