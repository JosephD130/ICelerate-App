import { NextRequest, NextResponse } from "next/server";

// Simple in-memory sliding-window rate limiter.
// Resets on cold start — sufficient to prevent casual abuse on Vercel.

const WINDOW_MS = 60_000; // 1 minute
const LIMITS: Record<string, number> = {
  "/api/claude": 15,
  "/api/extract-pdf": 10,
  "/api/search": 10,
};

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only rate-limit API routes
  const limit = LIMITS[pathname];
  if (!limit) return NextResponse.next();

  const ip = getClientIp(req);
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Slide the window — remove timestamps older than WINDOW_MS
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= limit) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  entry.timestamps.push(now);
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/claude", "/api/extract-pdf", "/api/search"],
};
