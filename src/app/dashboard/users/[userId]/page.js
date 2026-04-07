import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/authService";
import DashboardSidebar from "@/components/DashboardSidebar";
import AppText from "@/components/AppText";
import { fetchUserModerationDetail } from "@/lib/usersService";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT, SPACING } from "@/constants";
import DeleteUserModal from "../DeleteUserModal";

export const metadata = {
  title: "Granska användare – Spelinsikt Admin",
};

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

function truncate(value, max = 140) {
  if (!value) return "—";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function SectionCard({ title, subtitle, children }) {
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
          <AppText variant="caption" style={{ opacity: 0.55, marginTop: 2 }}>
            {subtitle}
          </AppText>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function StatPill({ label, value }) {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.borderSubtle}`,
        borderRadius: 10,
        padding: "10px 12px",
        minWidth: 110,
      }}
    >
      <AppText
        variant="caption"
        style={{
          opacity: 0.55,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: FONT_SIZES.tiny,
        }}
      >
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={{ marginTop: 2 }}>
        {value}
      </AppText>
    </div>
  );
}

export default async function UserReviewPage({ params, searchParams }) {
  const supabase = await createClient();
  const admin = await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/login",
  });

  const { userId } = await params;
  const { notice, tone } = await searchParams;

  const {
    user,
    stats,
    posts,
    comments,
    reportsMade,
    reportsAgainst,
    feelings,
    notifications,
    friendships,
    sponsorships,
    lovedOnesPhoto,
    onboarding,
    pushToken,
    error,
  } = await fetchUserModerationDetail(supabase, { userId });

  const noticeColor = tone === "error" ? COLORS.error : COLORS.primary;
  const expectedDeleteToken = user?.name?.trim() || user?.email?.trim() || user?.id || "";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar user={admin} activePage="/dashboard/users" />

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
            href="/dashboard/users"
            style={{
              display: "inline-block",
              marginBottom: 10,
              textDecoration: "none",
              fontFamily: FONT_FAMILY.primary,
              fontSize: FONT_SIZES.small,
              color: COLORS.link,
            }}
          >
            ← Tillbaka till användare
          </Link>

          <AppText as="h1" variant="pageTitle">
            Granska användare
          </AppText>
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

        {error || !user ? (
          <SectionCard title="Användaren hittades inte">
            <AppText variant="body" style={{ opacity: 0.7 }}>
              Kontot finns inte längre eller kunde inte hämtas.
            </AppText>
          </SectionCard>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: SPACING.x5 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: SPACING.x5 }}>
              <SectionCard title={user.name || "Namn saknas"} subtitle={`Skapad ${formatDate(user.created_at)}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt={user.name || "Avatar"}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `1px solid ${COLORS.borderSubtle}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${COLORS.borderSubtle}`,
                        background: `${COLORS.primary}15`,
                        fontFamily: FONT_FAMILY.primary,
                        fontWeight: FONT_WEIGHT.primary.semiBold,
                      }}
                    >
                      {(user.name?.[0] || "?").toUpperCase()}
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <AppText variant="bodyStrong">{user.email || "Ingen e-post"}</AppText>
                    <AppText variant="caption" style={{ opacity: 0.6 }}>
                      Roll: {user.role || "USER"} • Kommun: {user.municipality || "—"} • Ålder: {user.age || "—"}
                    </AppText>
                    <AppText variant="caption" style={{ opacity: 0.6 }}>
                      auth_id: {user.auth_id || "saknas"} • signup-frågor:{" "}
                      {user.signup_questions_done ? "klara" : "ej klara"}
                    </AppText>
                  </div>
                </div>

                <AppText as="p" variant="body" style={{ opacity: 0.82, whiteSpace: "pre-wrap" }}>
                  {user.bio || "Ingen bio."}
                </AppText>
              </SectionCard>

              <SectionCard title={`Inlägg (${stats.totalPosts})`} subtitle="Senaste inlägg">
                {posts.length === 0 ? (
                  <AppText variant="body" style={{ opacity: 0.6 }}>
                    Inga inlägg.
                  </AppText>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          border: `1px solid ${COLORS.borderSubtle}`,
                          borderRadius: 10,
                          padding: "10px 12px",
                        }}
                      >
                        <AppText variant="bodyStrong">{truncate(post.title, 70)}</AppText>
                        <AppText as="p" variant="caption" style={{ opacity: 0.65, marginTop: 2 }}>
                          {truncate(post.body, 160)}
                        </AppText>
                        <AppText variant="caption" style={{ opacity: 0.55 }}>
                          {formatDate(post.created_at)} • Audience: {post.audience}
                          {post.file ? " • Har bild" : ""}
                        </AppText>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title={`Kommentarer (${stats.totalComments})`} subtitle="Senaste kommentarer">
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
                        <AppText variant="body">{truncate(comment.text, 180)}</AppText>
                        <AppText variant="caption" style={{ opacity: 0.6 }}>
                          {formatDate(comment.created_at)} • På inlägg: {comment.feed?.title || comment.feedId}
                        </AppText>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: SPACING.x5 }}>
              <SectionCard title="Översikt">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <StatPill label="Inlägg" value={stats.totalPosts} />
                  <StatPill label="Kommentarer" value={stats.totalComments} />
                  <StatPill label="Rapporter gjorda" value={stats.totalReportsMade} />
                  <StatPill label="Rapporter mot user" value={stats.totalReportsAgainst} />
                  <StatPill label="Post-likes" value={stats.totalFeedLikes} />
                  <StatPill label="Kommentar-likes" value={stats.totalCommentLikes} />
                  <StatPill label="Vänner" value={stats.totalFriendships} />
                </div>
              </SectionCard>

              <SectionCard
                title={`Rapporter gjorda (${stats.totalReportsMade})`}
                subtitle="Inlägg som användaren har rapporterat"
              >
                {reportsMade.length === 0 ? (
                  <AppText variant="body" style={{ opacity: 0.6 }}>
                    Inga rapporter.
                  </AppText>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {reportsMade.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          border: `1px solid ${COLORS.borderSubtle}`,
                          borderRadius: 10,
                          padding: "8px 10px",
                        }}
                      >
                        <AppText variant="body">{truncate(entry.reason, 140)}</AppText>
                        <AppText variant="caption" style={{ opacity: 0.6 }}>
                          {formatDate(entry.created_at)} • Inlägg: {entry.feed?.title || entry.feed_id}
                        </AppText>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title={`Rapporter mot användaren (${stats.totalReportsAgainst})`}
                subtitle="När användarens inlägg rapporterats"
              >
                {reportsAgainst.length === 0 ? (
                  <AppText variant="body" style={{ opacity: 0.6 }}>
                    Inga rapporter mot denna användare.
                  </AppText>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {reportsAgainst.map((entry) => (
                      <div
                        key={entry.id}
                        style={{
                          border: `1px solid ${COLORS.borderSubtle}`,
                          borderRadius: 10,
                          padding: "8px 10px",
                        }}
                      >
                        <AppText variant="body">{truncate(entry.reason, 140)}</AppText>
                        <AppText variant="caption" style={{ opacity: 0.6 }}>
                          {formatDate(entry.created_at)} • Av: {entry.reporter?.name || "Okänd"}
                        </AppText>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Övrig data">
                <AppText variant="caption" style={{ opacity: 0.65 }}>
                  Feelings: {feelings.length} • Notiser: {notifications.length} • Friendships:{" "}
                  {friendships.length} • Sponsorships: {sponsorships.length}
                </AppText>
                <AppText variant="caption" style={{ opacity: 0.65 }}>
                  Onboarding: {onboarding ? "finns" : "saknas"} • Push token: {pushToken ? "finns" : "saknas"} •
                  Loved ones photo: {lovedOnesPhoto ? "finns" : "saknas"}
                </AppText>
              </SectionCard>

              <SectionCard title="Radera användare" subtitle="Permanent. Tar bort användare och relaterad data.">
                <DeleteUserModal userId={user.id} expectedDeleteToken={expectedDeleteToken} />
              </SectionCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
