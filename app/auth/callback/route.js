import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const role = searchParams.get("role");

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error.message);

    return NextResponse.redirect(
      `${origin}/sign-in?error=authentication_failed`
    );
  }

  return NextResponse.redirect(
    `${origin}/dashboard?role=${encodeURIComponent(role || "")}`
  );
}