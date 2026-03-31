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
