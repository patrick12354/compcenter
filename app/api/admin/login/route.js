import { NextResponse } from "next/server";
import {
  createAdminSession,
  getSessionCookieName,
  getSessionTtlSeconds,
  isValidAdminPassword
} from "@/lib/admin-auth";

export async function POST(request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");

  if (!isValidAdminPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid_credentials", request.url), 302);
  }

  const response = NextResponse.redirect(new URL("/admin/lomba/new", request.url), 302);
  response.cookies.set(getSessionCookieName(), createAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getSessionTtlSeconds(),
    path: "/"
  });
  return response;
}
