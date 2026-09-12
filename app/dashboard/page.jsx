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

  // Get data from Google/Supabase
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "";

  const nameParts = name.trim().split(" ");

  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || null;

  const email = user.email;

  const profilePhoto =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  // Send user to FastAPI
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        supabase_user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: role,
        phone: null,
        personnel_id: null,
        unit: null,
        profile_photo: profilePhoto,
      }),
    }
  );

  const data = await response.json();

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-semibold capitalize text-gray-900">
          Signed in as {role.replaceAll("_", " ")}
        </h1>

        <div className="mt-6 text-gray-600">
          <p>Name: {name}</p>
          <p>Email: {email}</p>
          <p>Supabase ID: {user.id}</p>
          <p>API: {data.message}</p>
        </div>
      </div>
    </main>
  );
}