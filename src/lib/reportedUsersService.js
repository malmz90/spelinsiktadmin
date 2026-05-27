export const REPORTED_USERS_PAGE_SIZE = 25;

const USER_REPORT_SELECT_FIELDS = `
  id,
  reporter_id,
  reported_id,
  reason,
  description,
  created_at,
  reporter:users!user_reports_reporter_fkey(id, name, email),
  reported:users!user_reports_reported_fkey(id, name, email)
`;

/**
 * Fetch paginated user reports for admin dashboard.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ page?: number; pageSize?: number }} options
 */
export async function fetchReportedUsersPage(
  supabase,
  { page = 1, pageSize = REPORTED_USERS_PAGE_SIZE } = {}
) {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedPageSize = Math.max(1, Number(pageSize) || REPORTED_USERS_PAGE_SIZE);

  const { count } = await supabase
    .from("user_reports")
    .select("id", { count: "exact", head: true });

  const totalReports = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalReports / normalizedPageSize));
  const safePage = Math.min(normalizedPage, totalPages);
  const from = (safePage - 1) * normalizedPageSize;
  const to = from + normalizedPageSize - 1;

  const { data: reports, error } = await supabase
    .from("user_reports")
    .select(USER_REPORT_SELECT_FIELDS)
    .order("created_at", { ascending: false })
    .range(from, to);

  return {
    reports: reports ?? [],
    error,
    totalReports,
    totalPages,
    safePage,
    canGoPrev: safePage > 1,
    canGoNext: safePage < totalPages,
    shownFrom: totalReports === 0 ? 0 : from + 1,
    shownTo: Math.min(from + (reports?.length ?? 0), totalReports),
  };
}
