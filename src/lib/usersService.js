export const USERS_PAGE_SIZE = 25;

/**
 * Calculate months elapsed since a given date (fractional).
 * Returns 0 if the date is in the future or invalid.
 *
 * @param {string} dateStr  ISO date string (e.g. "2024-03-15")
 * @returns {number}
 */
function monthsSince(dateStr) {
  if (!dateStr) return 0;
  const past = new Date(dateStr);
  const now = new Date();
  if (isNaN(past.getTime()) || past > now) return 0;

  const years = now.getFullYear() - past.getFullYear();
  const months = now.getMonth() - past.getMonth();
  const days = now.getDate() - past.getDate();

  // Average days per month: 30.4375
  return Math.max(0, years * 12 + months + days / 30.4375);
}

/**
 * Fetch savings stats across all users based on user_onboarding data.
 *
 * Saved amount per user = monthsSince(last_gamble_date) × monthly_gamble_spend
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {Promise<{
 *   totalSavedSEK: number;
 *   activeSavers: number;
 *   averageSavedSEK: number;
 *   totalWithQuitDate: number;
 * }>}
 */
export async function fetchSavingsStats(supabase) {
  const { data, error } = await supabase
    .from("user_onboarding")
    .select("last_gamble_date, monthly_gamble_spend")
    .not("last_gamble_date", "is", null)
    .not("monthly_gamble_spend", "is", null)
    .gt("monthly_gamble_spend", 0);

  if (error || !data) {
    return { totalSavedSEK: 0, activeSavers: 0, averageSavedSEK: 0, totalWithQuitDate: 0 };
  }

  let totalSavedSEK = 0;
  let activeSavers = 0;

  for (const row of data) {
    const months = monthsSince(row.last_gamble_date);
    if (months > 0) {
      totalSavedSEK += months * Number(row.monthly_gamble_spend);
      activeSavers++;
    }
  }

  return {
    totalSavedSEK: Math.round(totalSavedSEK),
    activeSavers,
    averageSavedSEK: activeSavers > 0 ? Math.round(totalSavedSEK / activeSavers) : 0,
    totalWithQuitDate: data.length,
  };
}

const USER_SELECT_FIELDS = "id, name, email, role, municipality, avatar, created_at";

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

async function countByEq(supabase, table, column, value) {
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  return count ?? 0;
}

/**
 * Fetch detailed moderation data for one user.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ userId: string }} options
 */
export async function fetchUserModerationDetail(supabase, { userId }) {
  const { data: user, error } = await supabase
    .from("users")
    .select(
      "id, name, email, role, municipality, avatar, bio, created_at, updated_at, signup_questions_done, auth_id"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !user) {
    return {
      user: null,
      stats: null,
      posts: [],
      comments: [],
      reportsMade: [],
      reportsAgainst: [],
      feelings: [],
      notifications: [],
      friendships: [],
      sponsorships: [],
      lovedOnesPhoto: null,
      onboarding: null,
      pushToken: null,
      error: error ?? new Error("User not found"),
    };
  }

  const [
    postsRes,
    commentsRes,
    reportsMadeRes,
    reportsAgainstRes,
    feelingsRes,
    notificationsRes,
    friendshipsRes,
    sponsorshipSponsorRes,
    sponsorshipGamblerRes,
    lovedOnesRes,
    onboardingRes,
    pushTokenRes,
    totalPosts,
    totalComments,
    totalReportsMade,
    totalReportsAgainst,
    totalFeedLikes,
    totalCommentLikes,
  ] = await Promise.all([
    supabase
      .from("feeds")
      .select("id, title, body, file, audience, is_edited, created_at")
      .eq("userid", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("comments")
      .select("id, feedId, text, created_at, feed:feeds!comments_feedId_fkey(id, title)")
      .eq("userId", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("post_reports")
      .select(
        "id, reason, created_at, feed_id, feed:feeds!post_reports_feed_id_fkey(id, title), post_owner:users!post_reports_post_owner_id_fkey(id, name)"
      )
      .eq("reporter_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("post_reports")
      .select(
        "id, reason, created_at, feed_id, feed:feeds!post_reports_feed_id_fkey(id, title), reporter:users!post_reports_reporter_id_fkey(id, name)"
      )
      .eq("post_owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("user_feelings")
      .select("id, feeling, reasons, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("friendships")
      .select("id, sender_id, receiver_id, status, created_at, updated_at")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("sponsorships")
      .select("id, sponsor_id, gambler_id, status, created_at, updated_at")
      .eq("sponsor_id", userId)
      .maybeSingle(),
    supabase
      .from("sponsorships")
      .select("id, sponsor_id, gambler_id, status, created_at, updated_at")
      .eq("gambler_id", userId)
      .maybeSingle(),
    supabase
      .from("loved_ones_photos")
      .select("id, image_path, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_onboarding")
      .select(
        "id, last_gamble_date, monthly_gamble_spend, reason_for_quitting, feeling_today, created_at, updated_at, signup_questions_done"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_push_tokens")
      .select("id, token, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    countByEq(supabase, "feeds", "userid", userId),
    countByEq(supabase, "comments", "userId", userId),
    countByEq(supabase, "post_reports", "reporter_id", userId),
    countByEq(supabase, "post_reports", "post_owner_id", userId),
    countByEq(supabase, "feedLikes", "userId", userId),
    countByEq(supabase, "commentLikes", "userId", userId),
  ]);

  return {
    user,
    stats: {
      totalPosts,
      totalComments,
      totalReportsMade,
      totalReportsAgainst,
      totalFeedLikes,
      totalCommentLikes,
      totalFriendships: (friendshipsRes.data ?? []).length,
      totalNotifications: notificationsRes.data?.length ?? 0,
    },
    posts: postsRes.data ?? [],
    comments: commentsRes.data ?? [],
    reportsMade: reportsMadeRes.data ?? [],
    reportsAgainst: reportsAgainstRes.data ?? [],
    feelings: feelingsRes.data ?? [],
    notifications: notificationsRes.data ?? [],
    friendships: friendshipsRes.data ?? [],
    sponsorships: [sponsorshipSponsorRes.data, sponsorshipGamblerRes.data].filter(Boolean),
    lovedOnesPhoto: lovedOnesRes.data ?? null,
    onboarding: onboardingRes.data ?? null,
    pushToken: pushTokenRes.data ?? null,
    error: null,
  };
}

