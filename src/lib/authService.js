import { redirect } from "next/navigation";

/**
 * Check whether a given user ID exists in the admin_users table.
 * Pass the already-created supabase client to avoid redundant cookie reads.
 *
 * NOTE: This check is a convenience layer — always enforce access via
 * Supabase Row Level Security policies as the authoritative source of truth.
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
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 */
export async function hasAdminAccess(supabase, userId) {
  return isAdmin(supabase, userId);
}

/**
 * Require authenticated + admin user, otherwise redirect.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ loginRedirect?: string; notAdminRedirect?: string }} options
 */
export async function requireAdminUser(
  supabase,
  { loginRedirect = "/login", notAdminRedirect = "/dashboard" } = {}
) {
  const user = await requireAuthenticatedUser(supabase, loginRedirect);
  const admin = await hasAdminAccess(supabase, user.id);

  if (!admin) redirect(notAdminRedirect);
  return user;
}

