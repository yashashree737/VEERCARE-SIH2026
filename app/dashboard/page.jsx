import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const role = params?.role || "user";

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Not authenticated</p>
      </main>
    );
  }

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "User";

  const email = user.email;

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-semibold capitalize text-gray-900">
          Signed in as {role.replaceAll("_", " ")}
        </h1>

        <div className="mt-6 text-gray-600">
          <p>Name: {name}</p>
          <p>Email: {email}</p>
        </div>
      </div>
    </main>
  );
}