"use client";

import { createClient } from "@/lib/supabase/client";

const roles = [
  {
    title: "Sign in as Soldier",
    role: "soldier",
  },
  {
    title: "Sign in as Commander",
    role: "commander",
  },
  {
    title: "Sign in as Welfare Officer",
    role: "welfare_officer",
  },
  {
    title: "Sign in as HR",
    role: "hr",
  },
];

export default function SignInPage() {
  const supabase = createClient();

  const handleGoogleSignIn = async (role) => {
    const redirectTo = `${window.location.origin}/auth/callback?role=${role}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Choose your role to continue
          </p>
        </div>

        <div className="space-y-3">
          {roles.map((item) => (
            <button
              key={item.role}
              onClick={() => handleGoogleSignIn(item.role)}
              className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}