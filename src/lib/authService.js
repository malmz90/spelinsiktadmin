import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Check whether a given user ID exists in the admin_users table.
 *
 * Pass a service-role client so admin access checks keep working even when
 * application RLS does not expose admin metadata to normal users.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function isAdmin(supabase, userId) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) return false;
  return true;
}

/**
 * Fetch current authenticated user and redirect if missing.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} redirectTo
 */
export async function requireAuthenticatedUser(supabase, redirectTo = "/login") {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(redirectTo);
  return user;
}

/**
 * Check whether a user has admin access.
 *
 * @param {string} userId
 * @param {{ adminSupabase?: import("@supabase/supabase-js").SupabaseClient }} options
 */
export async function hasAdminAccess(userId, { adminSupabase } = {}) {
  return isAdmin(adminSupabase ?? createAdminClient(), userId);
}

/**
 * Require authenticated + admin user, otherwise redirect.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ loginRedirect?: string; notAdminRedirect?: string; adminSupabase?: import("@supabase/supabase-js").SupabaseClient }} options
 */
export async function requireAdminUser(
  supabase,
  {
    loginRedirect = "/login",
    notAdminRedirect = "/dashboard",
    adminSupabase,
  } = {}
) {
  const user = await requireAuthenticatedUser(supabase, loginRedirect);
  const admin = await hasAdminAccess(user.id, { adminSupabase });

  if (!admin) redirect(notAdminRedirect);
  return user;
}

