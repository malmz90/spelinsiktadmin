export const USERS_PAGE_SIZE = 25;

const USER_SELECT_FIELDS = "id, name, email, role, municipality, avatar, age, created_at";

function applyUsersSearch(query, search) {
  if (!search) return query;
  return query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
}

/**
 * Fetch paginated users for admin dashboard.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ search?: string; page?: number; pageSize?: number }} options
 */
export async function fetchUsersPage(
  supabase,
  { search = "", page = 1, pageSize = USERS_PAGE_SIZE } = {}
) {
  const normalizedSearch = search.trim();
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedPageSize = Math.max(1, Number(pageSize) || USERS_PAGE_SIZE);

  let countQuery = supabase.from("users").select("id", { count: "exact", head: true });
  countQuery = applyUsersSearch(countQuery, normalizedSearch);

  const { count } = await countQuery;

  const totalUsers = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / normalizedPageSize));
  const safePage = Math.min(normalizedPage, totalPages);
  const from = (safePage - 1) * normalizedPageSize;
  const to = from + normalizedPageSize - 1;

  let usersQuery = supabase
    .from("users")
    .select(USER_SELECT_FIELDS)
    .order("created_at", { ascending: false })
    .range(from, to);

  usersQuery = applyUsersSearch(usersQuery, normalizedSearch);

  const { data: users, error } = await usersQuery;

  return {
    users,
    error,
    totalUsers,
    totalPages,
    safePage,
    canGoPrev: safePage > 1,
    canGoNext: safePage < totalPages,
    shownFrom: totalUsers === 0 ? 0 : from + 1,
    shownTo: Math.min(from + (users?.length ?? 0), totalUsers),
  };
}

