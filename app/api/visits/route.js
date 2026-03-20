import { NextResponse } from "next/server";

const VISIT_COOKIE_NAME = "iris-site-visit-counted";
const VISIT_COOKIE_MAX_AGE = 60 * 60 * 12;
const DEFAULT_COUNTER_KEY = "iris:site:views";

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  const key = process.env.UPSTASH_REDIS_KEY || DEFAULT_COUNTER_KEY;

  return {
    enabled: Boolean(url && token),
    url,
    token,
    key
  };
}

async function callRedis(path) {
  const config = getRedisConfig();
  const response = await fetch(`${config.url}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Counter storage request failed: ${errorText}`);
  }

  const result = await response.json();
  return Number.parseInt(String(result?.result || "0"), 10) || 0;
}

async function getVisitCount() {
  const { key } = getRedisConfig();
  return callRedis(`/get/${encodeURIComponent(key)}`);
}

async function incrementVisitCount() {
  const { key } = getRedisConfig();
  return callRedis(`/incr/${encodeURIComponent(key)}`);
}

export async function GET(request) {
  const config = getRedisConfig();

  if (!config.enabled) {
    return NextResponse.json({
      enabled: false,
      count: null
    });
  }

  try {
    const alreadyCounted = Boolean(request.cookies.get(VISIT_COOKIE_NAME)?.value);
    const count = alreadyCounted ? await getVisitCount() : await incrementVisitCount();

    const response = NextResponse.json({
      enabled: true,
      count
    });

    if (!alreadyCounted) {
      response.cookies.set(VISIT_COOKIE_NAME, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: VISIT_COOKIE_MAX_AGE,
        path: "/"
      });
    }

    return response;
  } catch {
    return NextResponse.json({
      enabled: false,
      count: null
    });
  }
}
