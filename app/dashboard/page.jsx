"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const role = searchParams.get("role");

  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error(error);
        return;
      }

      setUser(data.user);
    };

    getUser();
  }, []);

  const formattedRole = role
    ? role.replace("_", " ")
    : "user";

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-semibold capitalize text-gray-900">
          Signed in as {formattedRole}
        </h1>

        <div className="mt-4 text-gray-600">
          <p>Name: {user.user_metadata?.full_name}</p>
          <p>Email: {user.email}</p>
        </div>
      </div>
    </main>
  );
}