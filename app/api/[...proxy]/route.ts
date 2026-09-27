import { NextRequest, NextResponse } from "next/server";

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  // Read environment variables inside the function to ensure Vercel picks up runtime values
  const BACKEND_API_BASE = process.env.API_BASE || "http://127.0.0.1:8000";
  const API_KEY = process.env.API_KEY || "";

  const resolvedParams = await params;
  const pathParts = resolvedParams.proxy || [];

  // ── Auth Routes: handled by the Next.js server using HttpOnly cookies ──────
  if (pathParts[0] === "auth") {

    // POST /api/auth/login
    if (pathParts[1] === "login" && req.method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
      }

      const backendRes = await fetch(`${BACKEND_API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!backendRes.ok) {
        let errData: Record<string, unknown> = {};
        try { errData = await backendRes.json(); } catch { errData = { detail: "Failed to login" }; }
        return NextResponse.json(errData, { status: backendRes.status });
      }

      const rawRes = await backendRes.json();
      // FastAPI may return the JWT as `access_token` or `token`
      const backendToken: string = rawRes.access_token || rawRes.token || "";
      const userObj = rawRes.user;

      let mappedRole = "admin";
      if (userObj.role === "soldier") mappedRole = "personnel";
      else if (userObj.role === "commander") mappedRole = "commander";
      else if (userObj.role === "welfare_officer" || userObj.role === "welfare") mappedRole = "welfare";
      else if (userObj.role === "hr_officer" || userObj.role === "admin") mappedRole = "admin";

      const authUser = {
        user_id: String(userObj.id),
        name: `${userObj.first_name} ${userObj.last_name || ""}`.trim(),
        role: mappedRole,
        rank:
          userObj.role === "soldier"
            ? "Constable"
            : userObj.role === "commander"
            ? "Commander"
            : "Officer",
        unit_id: userObj.unit_id ? String(userObj.unit_id) : "U012",
        personnel_id: userObj.personnel_id,
      };

      const responsePayload = {
        // Keep a token in the response payload so existing frontend types don't break
        token: backendToken || `token-user-${userObj.id}`,
        user: authUser,
      };

      const response = NextResponse.json(responsePayload);

      // Store both the user profile AND the real backend JWT in the HttpOnly cookie
      response.cookies.set(
        "veercare_session",
        JSON.stringify({ user: authUser, jwt: backendToken }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 1 week
        }
      );

      return response;
    }

    // GET /api/auth/me
    if (pathParts[1] === "me" && req.method === "GET") {
      const sessionStr = req.cookies.get("veercare_session")?.value;
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          // Support both old (plain user object) and new ({ user, jwt }) formats
          const user = session.user ?? session;
          return NextResponse.json(user);
        } catch { /* ignore */ }
      }
      return NextResponse.json({ detail: "No stored session" }, { status: 401 });
    }

    // POST /api/auth/logout
    if (pathParts[1] === "logout" && req.method === "POST") {
      const response = NextResponse.json({ message: "Logged out successfully" });
      response.cookies.delete("veercare_session");
      return response;
    }
  }

  // ── General API Proxy ────────────────────────────────────────────────────────
  // Read the user's backend JWT from the session cookie and forward it as the Bearer token.
  // This is the real JWT issued by FastAPI on login — required for all protected /api/* routes.
  // Falls back to API_KEY if no active session (e.g. public endpoints).
  let bearerToken = API_KEY;
  const sessionStr = req.cookies.get("veercare_session")?.value;
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session.jwt) bearerToken = session.jwt;
    } catch { /* ignore */ }
  }

  const path = pathParts.join("/");
  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${BACKEND_API_BASE}/api/${path}${searchParams ? `?${searchParams}` : ""}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${bearerToken}`);
  headers.set("Content-Type", req.headers.get("Content-Type") || "application/json");

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const text = await req.text();
      if (text) fetchOptions.body = text;
    } catch { /* ignore */ }
  }

  const backendRes = await fetch(targetUrl, fetchOptions);

  const responseHeaders = new Headers();
  const backendContentType = backendRes.headers.get("Content-Type");
  if (backendContentType) responseHeaders.set("Content-Type", backendContentType);

  let responseBody = "";
  try { responseBody = await backendRes.text(); } catch { /* ignore */ }

  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: responseHeaders,
  });
}

export { handleProxy as GET, handleProxy as POST, handleProxy as PUT, handleProxy as DELETE, handleProxy as PATCH };
