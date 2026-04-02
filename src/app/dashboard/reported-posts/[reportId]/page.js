import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/authService";
import DashboardSidebar from "@/components/DashboardSidebar";
import AppText from "@/components/AppText";
import { fetchReportedPostDetail } from "@/lib/reportedPostsService";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT, SPACING } from "@/constants";
import ConfirmSubmitButton from "../ConfirmSubmitButton";
import { deleteReportedFeedAction } from "../actions";

export const metadata = {
  title: "Granska rapporterat inlägg – Spelinsikt Admin",
};

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function parseStorageReference(fileValue) {
  const raw = String(fileValue ?? "").trim();
  if (!raw) return null;

  const fromStoragePathname = (pathname) => {
    const cleaned = pathname.replace(/^\/+/, "");
    const parts = cleaned.split("/");
    const objectIndex = parts.indexOf("object");
    if (objectIndex === -1) return null;

    const mode = parts[objectIndex + 1];
    const bucket = parts[objectIndex + 2];
    const pathParts = parts.slice(objectIndex + 3);
    if (!bucket || pathParts.length === 0) return null;

    return {
      bucket: decodeURIComponent(bucket),
      path: decodeURIComponent(pathParts.join("/")),
      isPublicMode: mode === "public",
    };
  };

  if (isAbsoluteUrl(raw)) {
    try {
      const url = new URL(raw);
      const parsed = fromStoragePathname(url.pathname);
      if (parsed) return { ...parsed, directUrl: raw };
      return { directUrl: raw };
    } catch {
      return { directUrl: raw };
    }
  }

  if (raw.startsWith("/storage/")) {
    const parsed = fromStoragePathname(raw);
    if (parsed) return parsed;
  }

  // Fallback for values like "bucket/path/to/file.jpg"
  const fallbackParts = raw.replace(/^\/+/, "").split("/");
  if (fallbackParts.length >= 2) {
    return {
      bucket: decodeURIComponent(fallbackParts[0]),
      path: decodeURIComponent(fallbackParts.slice(1).join("/")),
      isPublicMode: false,
    };
  }

  return null;
}

async function resolveImageUrl(supabase, fileValue) {
  const parsed = parseStorageReference(fileValue);
  if (!parsed) return null;
  if (parsed.directUrl && !parsed.bucket) return parsed.directUrl;
  if (!parsed.bucket || !parsed.path) return parsed.directUrl ?? null;

  // For private buckets, prefer a signed URL. For public buckets, this also works as fallback.
  const { data: signedData } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, 60 * 60);
  if (signedData?.signedUrl) return signedData.signedUrl;

  const { data: publicData } = supabase.storage.from(parsed.bucket).getPublicUrl(parsed.path);
  if (publicData?.publicUrl) return publicData.publicUrl;

  return parsed.directUrl ?? null;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FeedStatus({ report }) {
  const hasFeed = Boolean(report?.feed);
  if (!hasFeed) {
    return (
      <span
        style={{
          border: `1px solid ${COLORS.error}55`,
          borderRadius: 20,
          padding: "4px 10px",
          fontSize: FONT_SIZES.xSmall,
          color: COLORS.error,
          fontFamily: FONT_FAMILY.primary,
          fontWeight: FONT_WEIGHT.primary.semiBold,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Raderat
      </span>
    );
  }

  const isHidden = report.feed.audience === "ADMIN";
  if (isHidden) {
    return (
      <span
        style={{
          border: `1px solid ${COLORS.primary}55`,
          borderRadius: 20,
          padding: "4px 10px",
          fontSize: FONT_SIZES.xSmall,
          color: COLORS.primary,
          fontFamily: FONT_FAMILY.primary,
          fontWeight: FONT_WEIGHT.primary.semiBold,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Dold
      </span>
    );
  }

  return (
    <span
      style={{
        border: `1px solid ${COLORS.borderSubtle}`,
        borderRadius: 20,
        padding: "4px 10px",
        fontSize: FONT_SIZES.xSmall,
        color: COLORS.textPrimary,
        fontFamily: FONT_FAMILY.primary,
        fontWeight: FONT_WEIGHT.primary.semiBold,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        opacity: 0.7,
      }}
    >
      Aktiv
    </span>
  );
}

function SectionCard({ title, children, subtitle }) {
  return (
    <section
      style={{
        background: COLORS.backgroundPrimary,
        border: `1px solid ${COLORS.borderSubtle}`,
        borderRadius: 14,
        padding: "18px 20px",
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <AppText variant="bodyStrong" style={{ fontSize: FONT_SIZES.body }}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" style={{ opacity: 0.55, marginTop: 3 }}>
            {subtitle}
          </AppText>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default async function ReportedPostDetailPage({ params, searchParams }) {
  const supabase = await createClient();
  const user = await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/dashboard",
  });

  const { reportId } = await params;
  const { notice, tone } = await searchParams;
  const {
    report,
    allReportsForFeed,
    comments,
    feedLikeSummary,
    totalFeedLikes,
    totalCommentLikes,
    error,
  } = await fetchReportedPostDetail(supabase, { reportId });
  const imageUrl = await resolveImageUrl(supabase, report?.feed?.file);

  const noticeColor = tone === "error" ? COLORS.error : COLORS.primary;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar user={user} activePage="/dashboard/reported-posts" />

      <main
        style={{
          flex: 1,
          background: COLORS.backgroundSecondary,
          padding: "40px 48px",
          minWidth: 0,
        }}
      >
        <div style={{ marginBottom: SPACING.x7 }}>
          <Link
            href="/dashboard/reported-posts"
            style={{
              display: "inline-block",
              marginBottom: 10,
              textDecoration: "none",
              fontFamily: FONT_FAMILY.primary,
              fontSize: FONT_SIZES.small,
              color: COLORS.link,
            }}
          >
            ← Tillbaka till rapportlista
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <AppText as="h1" variant="pageTitle">
              Granska rapporterat inlägg
            </AppText>
            {report ? <FeedStatus report={report} /> : null}
          </div>
        </div>

        {notice ? (
          <div
            style={{
              marginBottom: SPACING.x5,
              border: `1px solid ${noticeColor}55`,
              background: `${noticeColor}12`,
              color: noticeColor,
              borderRadius: 10,
              padding: "10px 12px",
              fontFamily: FONT_FAMILY.primary,
              fontSize: FONT_SIZES.small,
              fontWeight: FONT_WEIGHT.primary.medium,
            }}
          >
            {notice}
          </div>
        ) : null}

        {error || !report ? (
          <SectionCard title="Rapport hittades inte">
            <AppText variant="body" style={{ opacity: 0.7 }}>
              Rapporten finns inte längre eller kunde inte hämtas.
            </AppText>
          </SectionCard>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: SPACING.x5 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING.x5 }}>
              <SectionCard
                title={report.feed?.title || "Utan titel"}
                subtitle={`Publicerat ${formatDate(report.feed?.created_at)}`}
              >
                <AppText as="p" variant="body" style={{ opacity: 0.85, whiteSpace: "pre-wrap" }}>
                  {report.feed?.body || "Inläggstext saknas"}
                </AppText>

                {report.feed?.file ? (
                  <div style={{ marginTop: 14 }}>
                    <AppText variant="caption" style={{ opacity: 0.55, marginBottom: 6 }}>
                      Bild
                    </AppText>
                    {imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt="Bild i rapporterat inlägg"
                          style={{
                            width: "100%",
                            maxHeight: 420,
                            objectFit: "cover",
                            borderRadius: 12,
                            border: `1px solid ${COLORS.borderSubtle}`,
                          }}
                        />
                      </>
                    ) : (
                      <AppText variant="caption" style={{ opacity: 0.6 }}>
                        Kunde inte läsa bildlänken: {report.feed.file}
                      </AppText>
                    )}
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard
                title={`Kommentarer (${comments.length})`}
                subtitle={`Totalt ${totalCommentLikes} reaktioner på kommentarer`}
              >
                {comments.length === 0 ? (
                  <AppText variant="body" style={{ opacity: 0.6 }}>
                    Inga kommentarer.
                  </AppText>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          border: `1px solid ${COLORS.borderSubtle}`,
                          borderRadius: 10,
                          padding: "10px 12px",
                        }}
                      >
                        <AppText variant="caption" style={{ opacity: 0.6 }}>
                          {comment.user?.name || "Okänd"} • {formatDate(comment.created_at)}
                        </AppText>
                        <AppText as="p" variant="body" style={{ marginTop: 4, opacity: 0.84 }}>
                          {comment.text || "Tom kommentar"}
                        </AppText>
                        <AppText variant="caption" style={{ opacity: 0.6 }}>
                          Reaktioner: {comment.likeCount}
                          {comment.likeSummary.length > 0
                            ? ` (${comment.likeSummary
                                .map((entry) => `${entry.emoji} ${entry.count}`)
                                .join(" • ")})`
                            : ""}
                        </AppText>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: SPACING.x5 }}>
              <SectionCard
                title={`Likes på inlägg (${totalFeedLikes})`}
                subtitle="Sammanställning av reaktioner på själva inlägget"
              >
                {feedLikeSummary.length === 0 ? (
                  <AppText variant="body" style={{ opacity: 0.6 }}>
                    Inga likes ännu.
                  </AppText>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {feedLikeSummary.map((entry) => (
                      <span
                        key={entry.emoji}
                        style={{
                          border: `1px solid ${COLORS.borderSubtle}`,
                          borderRadius: 999,
                          padding: "4px 10px",
                          fontFamily: FONT_FAMILY.primary,
                          fontSize: FONT_SIZES.small,
                        }}
                      >
                        {entry.emoji} {entry.count}
                      </span>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title={`Rapporter (${allReportsForFeed.length})`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {allReportsForFeed.map((feedReport) => (
                    <div
                      key={feedReport.id}
                      style={{
                        border: `1px solid ${COLORS.borderSubtle}`,
                        borderRadius: 10,
                        padding: "8px 10px",
                      }}
                    >
                      <AppText variant="caption" style={{ opacity: 0.6 }}>
                        {feedReport.reporter?.name || "Okänd"} • {formatDate(feedReport.created_at)}
                      </AppText>
                      <AppText as="p" variant="body" style={{ marginTop: 4, opacity: 0.86 }}>
                        {feedReport.reason}
                      </AppText>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Moderering">
                {!report.feed ? (
                  <AppText variant="body" style={{ opacity: 0.6 }}>
                    Inlägget är redan borttaget.
                  </AppText>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <form action={deleteReportedFeedAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="feedId" value={report.feed_id} />
                      <ConfirmSubmitButton
                        variant="danger"
                        confirmText="Radera permanent? Detta tar bort inlägget, kommentarer, likes och rapporter."
                        pendingText="Raderar..."
                      >
                        Radera permanent
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
