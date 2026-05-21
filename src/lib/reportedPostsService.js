export const REPORTED_POSTS_PAGE_SIZE = 25;

const REPORT_SELECT_FIELDS = `
  id,
  post_id,
  post_owner_id,
  reporter_id,
  reason,
  created_at,
  post:posts!post_reports_feed_id_fkey(id, title, body, file, audience, created_at),
  post_owner:users!post_reports_post_owner_id_fkey(id, name, email),
  reporter:users!post_reports_reporter_id_fkey(id, name, email)
`;

const SPONSORSHIP_SELECT_FIELDS =
  "id, sponsor_id, gambler_id, status, created_at, updated_at";

function getReportUserIds(reports = []) {
  return Array.from(
    new Set(
      reports
        .flatMap((report) => [report?.reporter_id, report?.post_owner_id])
        .filter(Boolean)
    )
  );
}

async function fetchSponsorshipsForUsers(supabase, userIds) {
  if (!userIds || userIds.length === 0) return [];

  const [{ data: sponsorMatches }, { data: gamblerMatches }] = await Promise.all([
    supabase
      .from("sponsorships")
      .select(SPONSORSHIP_SELECT_FIELDS)
      .in("sponsor_id", userIds),
    supabase
      .from("sponsorships")
      .select(SPONSORSHIP_SELECT_FIELDS)
      .in("gambler_id", userIds),
  ]);

  return Array.from(
    new Map(
      [...(sponsorMatches ?? []), ...(gamblerMatches ?? [])].map((sponsorship) => [
        sponsorship.id,
        sponsorship,
      ])
    ).values()
  );
}

function buildSponsorshipLookup(sponsorships = []) {
  const lookup = new Map();
  for (const sponsorship of sponsorships) {
    if (!sponsorship?.sponsor_id || !sponsorship?.gambler_id) continue;
    lookup.set(`${sponsorship.sponsor_id}:${sponsorship.gambler_id}`, sponsorship);
  }
  return lookup;
}

function getSponsorshipContext(report, sponsorshipLookup) {
  const reporterId = report?.reporter_id;
  const postOwnerId = report?.post_owner_id;
  if (!reporterId || !postOwnerId) return null;

  const sponsorship =
    sponsorshipLookup.get(`${reporterId}:${postOwnerId}`) ??
    sponsorshipLookup.get(`${postOwnerId}:${reporterId}`);

  if (!sponsorship) return null;

  return {
    sponsorship,
    status: sponsorship.status,
    reporterRole: sponsorship.sponsor_id === reporterId ? "sponsor" : "gambler",
    postOwnerRole: sponsorship.sponsor_id === postOwnerId ? "sponsor" : "gambler",
  };
}

async function addSponsorshipContext(supabase, reports = []) {
  if (!reports || reports.length === 0) return reports ?? [];

  const sponsorships = await fetchSponsorshipsForUsers(
    supabase,
    getReportUserIds(reports)
  );
  const sponsorshipLookup = buildSponsorshipLookup(sponsorships);

  return reports.map((report) => ({
    ...report,
    sponsorshipContext: getSponsorshipContext(report, sponsorshipLookup),
  }));
}

/**
 * Fetch paginated post reports for admin dashboard.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ page?: number; pageSize?: number }} options
 */
export async function fetchReportedPostsPage(
  supabase,
  { page = 1, pageSize = REPORTED_POSTS_PAGE_SIZE } = {}
) {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedPageSize = Math.max(1, Number(pageSize) || REPORTED_POSTS_PAGE_SIZE);

  const { count } = await supabase
    .from("post_reports")
    .select("id", { count: "exact", head: true });

  const totalReports = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalReports / normalizedPageSize));
  const safePage = Math.min(normalizedPage, totalPages);
  const from = (safePage - 1) * normalizedPageSize;
  const to = from + normalizedPageSize - 1;

  const { data: reports, error } = await supabase
    .from("post_reports")
    .select(REPORT_SELECT_FIELDS)
    .order("created_at", { ascending: false })
    .range(from, to);
  const reportsWithSponsorshipContext = await addSponsorshipContext(
    supabase,
    reports ?? []
  );

  return {
    reports: reportsWithSponsorshipContext,
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

function buildEmojiSummary(items, emojiField = "emoji") {
  const counts = new Map();
  for (const item of items ?? []) {
    const emoji = item?.[emojiField];
    if (!emoji) continue;
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([emoji, count]) => ({ emoji, count }));
}

/**
 * Fetch full moderation detail for a single report.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ reportId: string }} options
 */
export async function fetchReportedPostDetail(supabase, { reportId }) {
  const { data: report, error } = await supabase
    .from("post_reports")
    .select(
      `
      id,
      post_id,
      post_owner_id,
      reporter_id,
      reason,
      created_at,
      post:posts!post_reports_feed_id_fkey(id, title, body, file, audience, created_at),
      post_owner:users!post_reports_post_owner_id_fkey(id, name, email),
      reporter:users!post_reports_reporter_id_fkey(id, name, email)
    `
    )
    .eq("id", reportId)
    .maybeSingle();

  if (error || !report) {
    return {
      report: null,
      allReportsForFeed: [],
      comments: [],
      reactionSummary: [],
      totalPostReactions: 0,
      totalCommentLikes: 0,
      error: error ?? new Error("Report not found"),
    };
  }

  if (!report.post_id) {
    const [reportWithSponsorshipContext] = await addSponsorshipContext(supabase, [
      report,
    ]);

    return {
      report: reportWithSponsorshipContext,
      allReportsForFeed: [reportWithSponsorshipContext],
      comments: [],
      reactionSummary: [],
      totalPostReactions: 0,
      totalCommentLikes: 0,
      error: null,
    };
  }

  const [
    { data: allReportsForFeed },
    { data: commentsRaw },
    { data: postReactionsRaw },
  ] = await Promise.all([
    supabase
      .from("post_reports")
      .select(
        `
        id,
        reason,
        created_at,
        reporter_id,
        reporter:users!post_reports_reporter_id_fkey(id, name, email)
      `
      )
      .eq("post_id", report.post_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select(
        `
        id,
        post_id,
        user_id,
        text,
        created_at,
        user:users!comments_userId_fkey(id, name, email)
      `
      )
      .eq("post_id", report.post_id)
      .order("created_at", { ascending: false }),
    supabase.from("reactions").select("id, post_id, user_id, emoji").eq("post_id", report.post_id),
  ]);

  const commentIds = (commentsRaw ?? []).map((comment) => comment.id).filter(Boolean);
  const { data: commentLikesRaw } =
    commentIds.length > 0
      ? await supabase
          .from("comment_likes")
          .select("id, comment_id, user_id, emoji")
          .in("comment_id", commentIds)
      : { data: [] };

  const commentLikesByComment = new Map();
  for (const like of commentLikesRaw ?? []) {
    const key = like.comment_id;
    if (!commentLikesByComment.has(key)) commentLikesByComment.set(key, []);
    commentLikesByComment.get(key).push(like);
  }

  const comments = (commentsRaw ?? []).map((comment) => {
    const likes = commentLikesByComment.get(comment.id) ?? [];
    return {
      ...comment,
      likes,
      likeSummary: buildEmojiSummary(likes),
      likeCount: likes.length,
    };
  });

  const reactionSummary = buildEmojiSummary(postReactionsRaw ?? []);
  const totalCommentLikes = (commentLikesRaw ?? []).length;
  const allReportsWithOwner = (allReportsForFeed ?? [report]).map((feedReport) => ({
    ...feedReport,
    post_owner_id: report.post_owner_id,
  }));
  const allReportsWithSponsorshipContext = await addSponsorshipContext(
    supabase,
    allReportsWithOwner
  );
  const reportWithSponsorshipContext =
    allReportsWithSponsorshipContext.find((feedReport) => feedReport.id === report.id) ??
    (await addSponsorshipContext(supabase, [report]))[0];

  return {
    report: reportWithSponsorshipContext,
    allReportsForFeed: allReportsWithSponsorshipContext,
    comments,
    reactionSummary,
    totalPostReactions: (postReactionsRaw ?? []).length,
    totalCommentLikes,
    error: null,
  };
}
