import { NextRequest, NextResponse } from "next/server";

// Fallback logic, but ideally BACKEND_API_BASE should be set. 
// We use API_BASE which is server-side only so it's not exposed to the browser.
const BACKEND_API_BASE = process.env.API_BASE || "http://127.0.0.1:8000";
const API_KEY = process.env.API_KEY || "";

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ proxy: string[] }> }) {
  const resolvedParams = await params;
  const pathParts = resolvedParams.proxy || [];
  
  // Custom Auth Routes handled by Next.js server to use cookies
  if (pathParts[0] === "auth") {
    if (pathParts[1] === "login" && req.method === "POST") {
      let body;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
      }
      
      const backendUrl = `${BACKEND_API_BASE}/auth/login`;
      const backendRes = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify(body)
      });
      
      if (!backendRes.ok) {
        let errData = {};
        try {
          errData = await backendRes.json();
        } catch {
          errData = { detail: "Failed to login" };
        }
        return NextResponse.json(errData, { status: backendRes.status });
      }
      
      const rawRes = await backendRes.json();
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
        rank: userObj.role === "soldier" ? "Constable" : (userObj.role === "commander" ? "Commander" : "Officer"),
        unit_id: userObj.unit_id ? String(userObj.unit_id) : "U012",
        personnel_id: userObj.personnel_id,
      };

      const responsePayload = {
        token: `token-user-${userObj.id}`, // We return a dummy token so frontend types don't break
        user: authUser
      };

      const response = NextResponse.json(responsePayload);
      
      // Set HttpOnly cookie
      response.cookies.set("veercare_session", JSON.stringify(authUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      
      return response;
    }
    
    if (pathParts[1] === "me" && req.method === "GET") {
      const sessionStr = req.cookies.get("veercare_session")?.value;
      if (sessionStr) {
        try {
          const user = JSON.parse(sessionStr);
          return NextResponse.json(user);
        } catch {
          // ignore parsing error
        }
      }
      return NextResponse.json({ detail: "No stored session" }, { status: 401 });
    }
    
    if (pathParts[1] === "logout" && req.method === "POST") {
      const response = NextResponse.json({ message: "Logged out successfully" });
      response.cookies.delete("veercare_session");
      return response;
    }
  }

  // General API Proxy
  const path = pathParts.join("/");
  const searchParams = req.nextUrl.searchParams.toString();
  const targetUrl = `${BACKEND_API_BASE}/api/${path}${searchParams ? `?${searchParams}` : ""}`;
  
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${API_KEY}`);
  
  const contentType = req.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  } else {
    headers.set("Content-Type", "application/json");
  }

  // Only copy GET/POST body if there is one
  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store"
  };
  
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const text = await req.text();
      if (text) fetchOptions.body = text;
    } catch {
      // Ignore body reading errors
    }
  }
  
  const backendRes = await fetch(targetUrl, fetchOptions);
  
  const responseHeaders = new Headers();
  const backendContentType = backendRes.headers.get("Content-Type");
  if (backendContentType) {
    responseHeaders.set("Content-Type", backendContentType);
  }
  
  let responseBody;
  try {
    responseBody = await backendRes.text();
  } catch {
    responseBody = "";
  }
  
  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: responseHeaders
  });
}

export { handleProxy as GET, handleProxy as POST, handleProxy as PUT, handleProxy as DELETE, handleProxy as PATCH };
