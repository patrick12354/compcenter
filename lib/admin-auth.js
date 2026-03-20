import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "iris_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSessionSecret() {
  return getRequiredEnv("ADMIN_SESSION_SECRET");
}

function base64urlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function buildSessionValue(payloadObject) {
  const payload = base64urlEncode(JSON.stringify(payloadObject));
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function parseSessionValue(value) {
  if (!value || !value.includes(".")) return null;

  const [payload, signature] = value.split(".");
  const expectedSignature = signPayload(payload);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createAdminSession() {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  return buildSessionValue({ role: "admin", expiresAt });
}

export function isValidAdminPassword(password) {
  const configuredPassword = getRequiredEnv("ADMIN_PASSWORD");
  return password === configuredPassword;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  return parseSessionValue(raw);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionTtlSeconds() {
  return SESSION_TTL_SECONDS;
}
