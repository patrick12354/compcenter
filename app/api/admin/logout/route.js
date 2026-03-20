import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/admin-auth";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 302);
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/"
  });
  return response;
}
