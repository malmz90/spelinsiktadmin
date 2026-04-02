export const REPORTED_POSTS_PAGE_SIZE = 25;

const REPORT_SELECT_FIELDS = `
  id,
  feed_id,
  post_owner_id,
  reporter_id,
  reason,
  created_at,
  feed:feeds!post_reports_feed_id_fkey(id, title, body, file, audience, created_at),
  post_owner:users!post_reports_post_owner_id_fkey(id, name, email),
  reporter:users!post_reports_reporter_id_fkey(id, name, email)
`;

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

  return {
    reports,
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
      feed_id,
      post_owner_id,
      reporter_id,
      reason,
      created_at,
      feed:feeds!post_reports_feed_id_fkey(id, title, body, file, audience, created_at),
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
      feedLikeSummary: [],
      totalFeedLikes: 0,
      totalCommentLikes: 0,
      error: error ?? new Error("Report not found"),
    };
  }

  if (!report.feed_id) {
    return {
      report,
      allReportsForFeed: [report],
      comments: [],
      feedLikeSummary: [],
      totalFeedLikes: 0,
      totalCommentLikes: 0,
      error: null,
    };
  }

  const [
    { data: allReportsForFeed },
    { data: commentsRaw },
    { data: feedLikesRaw },
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
      .eq("feed_id", report.feed_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select(
        `
        id,
        feedId,
        userId,
        text,
        created_at,
        user:users!comments_userId_fkey(id, name, email)
      `
      )
      .eq("feedId", report.feed_id)
      .order("created_at", { ascending: false }),
    supabase.from("feedLikes").select("id, feedId, userId, emoji").eq("feedId", report.feed_id),
  ]);

  const commentIds = (commentsRaw ?? []).map((comment) => comment.id).filter(Boolean);
  const { data: commentLikesRaw } =
    commentIds.length > 0
      ? await supabase
          .from("commentLikes")
          .select("id, commentId, userId, emoji")
          .in("commentId", commentIds)
      : { data: [] };

  const commentLikesByComment = new Map();
  for (const like of commentLikesRaw ?? []) {
    const key = like.commentId;
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

  const feedLikeSummary = buildEmojiSummary(feedLikesRaw ?? []);
  const totalCommentLikes = (commentLikesRaw ?? []).length;

  return {
    report,
    allReportsForFeed: allReportsForFeed ?? [report],
    comments,
    feedLikeSummary,
    totalFeedLikes: (feedLikesRaw ?? []).length,
    totalCommentLikes,
    error: null,
  };
}
