import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Proxies to BACKEND_API_BASE/health using the same API_KEY used by all other proxy calls.
 * This is a dedicated route (not the catch-all proxy) so the path does NOT get /api/ prepended.
 * Always returns HTTP 200 so the client fire-and-forget never throws or affects the user.
 */
export async function GET() {
  const BACKEND_API_BASE = process.env.API_BASE || "http://127.0.0.1:8000";
  const API_KEY = process.env.API_KEY || "";

  try {
    const res = await fetch(`${BACKEND_API_BASE}/health`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15_000), // 15 s — generous for Render cold-start
      cache: "no-store",
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }

    return NextResponse.json(
      { status: res.status, ok: res.ok, data: body },
      { status: 200 } // always 200 so the client fetch never rejects
    );
  } catch (err: unknown) {
    // AbortSignal.timeout() throws a DOMException with name "TimeoutError"
    const isTimeout =
      (err instanceof DOMException && err.name === "TimeoutError") ||
      (err instanceof Error && err.name === "AbortError");

    const message = isTimeout
      ? "Backend health check timed out (15 s). Render instance may still be waking up."
      : err instanceof Error
      ? err.message
      : String(err);

    return NextResponse.json(
      { status: null, ok: false, timedOut: isTimeout, error: message },
      { status: 200 }
    );
  }
}
