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
      "id, name, email, role, municipality, avatar, age, bio, created_at, updated_at, signup_questions_done, auth_id"
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

