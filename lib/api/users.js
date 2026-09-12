export async function syncUser(user, role, accessToken) {
    const api_base_url = process.env.API_URL;
    const api_key = process.env.API_KEY;

    const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";

    const nameParts = name.trim().split(" ");

    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || null;

    const profilePhoto =
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null;

    const response = await fetch(
        `${api_base_url}/users/`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${api_key}`,
            },
            body: JSON.stringify({
                supabase_user_id: user.id,
                first_name: firstName,
                last_name: lastName,
                email: user.email,
                role: role,
                phone: null,
                personnel_id: null,
                unit: null,
                profile_photo: profilePhoto,
            }),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Failed to sync user: ${response.status} ${errorText}`
        );
    }

    return response.json();
}