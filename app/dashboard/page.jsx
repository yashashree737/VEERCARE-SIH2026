import { createClient } from "@/lib/supabase/server";
import { syncUser } from "@/lib/api/users";

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>No authentication token found</p>
      </main>
    );
  }

  const data = await syncUser(
    user,
    role,
    session.access_token
  );
  
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "User";

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-semibold capitalize text-gray-900">
          Signed in as {role.replaceAll("_", " ")}
        </h1>

        <div className="mt-6 text-gray-600">
          <p>Name: {name}</p>
          <p>Email: {user.email}</p>
          <p>Supabase ID: {user.id}</p>
          <p>API: {data.message}</p>
        </div>
      </div>
    </main>
  );
}