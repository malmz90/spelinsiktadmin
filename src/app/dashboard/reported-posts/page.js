import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/authService";
import {
  REPORTED_POSTS_PAGE_SIZE,
  fetchReportedPostsPage,
} from "@/lib/reportedPostsService";
import DashboardSidebar from "@/components/DashboardSidebar";
import AppText from "@/components/AppText";
import {
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  FONT_WEIGHT,
  SPACING,
} from "@/constants";

export const metadata = {
  title: "Rapporterade inlägg – Spelinsikt Admin",
};
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncate(text, maxLength = 88) {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function SponsorshipBadge({ role, status }) {
  if (!role) return null;

  const isSponsor = role === "sponsor";
  const label = isSponsor ? "Sponsor/familj" : "Får stöd";
  const statusLabel = status === "pending" ? "väntar" : "aktiv";
  const tone = isSponsor ? COLORS.primary : COLORS.info;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: "fit-content",
        marginTop: 5,
        border: `1px solid ${tone}44`,
        borderRadius: 999,
        background: `${tone}12`,
        color: tone,
        padding: "2px 7px",
        fontFamily: FONT_FAMILY.primary,
        fontSize: FONT_SIZES.xSmall,
        fontWeight: FONT_WEIGHT.primary.semiBold,
        lineHeight: 1.25,
      }}
      title={`Sponsor/familj-relation: ${statusLabel}`}
    >
      {label}
      <span style={{ opacity: 0.65, marginLeft: 4 }}>({statusLabel})</span>
    </span>
  );
}

function PostPreview({ post }) {
  if (!post) return <AppText variant="body">Inlägg saknas</AppText>;

  const title = post.title?.trim();
  const body = post.body?.trim();

  return (
    <div style={{ minWidth: 0 }}>
      <AppText
        variant="bodyStrong"
        numberOfLines={1}
        style={{ fontSize: FONT_SIZES.small }}
      >
        {truncate(title || "Utan titel", 52)}
      </AppText>
      <AppText
        variant="caption"
        numberOfLines={2}
        style={{ opacity: 0.6, fontSize: FONT_SIZES.xSmall, marginTop: 2 }}
      >
        {truncate(body || "Ingen text i inlägget", 110)}
      </AppText>
    </div>
  );
}

function UserCell({ user, sponsorshipRole, sponsorshipStatus }) {
  if (!user) {
    return (
      <AppText
        variant="body"
        style={{ fontSize: FONT_SIZES.small, opacity: 0.5 }}
      >
        Okänd användare
      </AppText>
    );
  }

  return (
    <div style={{ minWidth: 0 }}>
      <AppText
        variant="bodyStrong"
        numberOfLines={1}
        style={{ fontSize: FONT_SIZES.small }}
      >
        {user.name || "Namn saknas"}
      </AppText>
      <AppText
        variant="caption"
        numberOfLines={1}
        style={{ fontSize: FONT_SIZES.xSmall, opacity: 0.55, marginTop: 1 }}
      >
        {user.email || "E-post saknas"}
      </AppText>
      <SponsorshipBadge role={sponsorshipRole} status={sponsorshipStatus} />
    </div>
  );
}

function getReportStatus(report) {
  if (!report?.post) return "Raderat";
  if (report.post.audience === "ADMIN") return "Dold";
  return "Aktiv";
}

export default async function ReportedPostsPage({ searchParams }) {
  const supabase = await createClient();
  const user = await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/dashboard",
  });

  const { page: pageParam, notice, tone } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const {
    reports,
    error,
    totalReports,
    safePage,
    canGoPrev,
    canGoNext,
    shownFrom,
    shownTo,
  } = await fetchReportedPostsPage(supabase, {
    page,
    pageSize: REPORTED_POSTS_PAGE_SIZE,
  });

  const buildPageHref = (nextPage) => {
    const params = new URLSearchParams();
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/dashboard/reported-posts?${qs}` : "/dashboard/reported-posts";
  };

  if (page !== safePage) {
    redirect(buildPageHref(safePage));
  }

  const COL = {
    post: "1.2fr",
    reporter: "0.95fr",
    owner: "0.95fr",
    reason: "1fr",
    status: "90px",
    date: "120px",
    actions: "110px",
  };

  const gridTemplate = `${COL.post} ${COL.reporter} ${COL.owner} ${COL.reason} ${COL.status} ${COL.date} ${COL.actions}`;
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
        <div style={{ marginBottom: SPACING.x8 }}>
          <AppText as="h1" variant="pageTitle">
            Rapporterade inlägg
          </AppText>
          <div style={{ marginTop: 6 }}>
            <AppText variant="caption" style={{ opacity: 0.6 }}>
              Översikt över inlägg som har blivit rapporterade av användare
            </AppText>
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SPACING.x4,
            marginBottom: SPACING.x6,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: COLORS.backgroundPrimary,
              border: `1px solid ${COLORS.borderSubtle}`,
              borderRadius: 10,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontFamily: FONT_FAMILY.primary,
                fontSize: FONT_SIZES.xSmall,
                fontWeight: FONT_WEIGHT.primary.medium,
                color: COLORS.textPrimary,
                opacity: 0.5,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Totalt rapporter
            </span>
            <span
              style={{
                fontFamily: FONT_FAMILY.primary,
                fontSize: FONT_SIZES.body,
                fontWeight: FONT_WEIGHT.primary.bold,
                color: COLORS.primary,
              }}
            >
              {totalReports}
            </span>
          </div>
        </div>

        <div
          style={{
            background: COLORS.backgroundPrimary,
            borderRadius: 16,
            border: `1px solid ${COLORS.borderSubtle}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              padding: "12px 24px",
              borderBottom: `1px solid ${COLORS.borderSubtle}`,
              gap: 16,
            }}
          >
            {[
              "Inlägg",
              "Rapporterad av",
              "Inläggsägare",
              "Anledning",
              "Status",
              "Datum",
              "",
            ].map((col) => (
              <span
                key={col}
                style={{
                  fontFamily: FONT_FAMILY.primary,
                  fontSize: FONT_SIZES.xSmall,
                  fontWeight: FONT_WEIGHT.primary.semiBold,
                  color: COLORS.textPrimary,
                  opacity: 0.45,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {col}
              </span>
            ))}
          </div>

          {error ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <AppText variant="body" style={{ color: COLORS.error }}>
                Kunde inte hämta rapporterade inlägg. Kontrollera
                databasanslutningen.
              </AppText>
            </div>
          ) : !reports || reports.length === 0 ? (
            <div
              style={{
                padding: "64px 24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AppText variant="bodyStrong" style={{ opacity: 0.5 }}>
                Inga rapporterade inlägg hittades
              </AppText>
            </div>
          ) : (
            reports.map((report, index) => (
              <div
                key={report.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: gridTemplate,
                  padding: "14px 24px",
                  gap: 16,
                  alignItems: "center",
                  borderBottom:
                    index < reports.length - 1
                      ? `1px solid ${COLORS.borderSubtle}`
                      : "none",
                  background:
                    index % 2 === 1
                      ? COLORS.backgroundSecondary
                      : COLORS.backgroundPrimary,
                  transition: "background 0.1s ease",
                }}
              >
                <PostPreview post={report.post} />

                <UserCell
                  user={report.reporter}
                  sponsorshipRole={report.sponsorshipContext?.reporterRole}
                  sponsorshipStatus={report.sponsorshipContext?.status}
                />

                <UserCell
                  user={report.post_owner}
                  sponsorshipRole={report.sponsorshipContext?.postOwnerRole}
                  sponsorshipStatus={report.sponsorshipContext?.status}
                />

                <AppText
                  variant="body"
                  numberOfLines={2}
                  style={{ fontSize: FONT_SIZES.small, opacity: 0.72 }}
                >
                  {truncate(report.reason, 110)}
                </AppText>

                <AppText
                  variant="caption"
                  style={{
                    fontSize: FONT_SIZES.xSmall,
                    opacity: 0.7,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: FONT_WEIGHT.primary.semiBold,
                  }}
                >
                  {getReportStatus(report)}
                </AppText>

                <AppText
                  variant="caption"
                  style={{ fontSize: FONT_SIZES.xSmall, opacity: 0.55 }}
                >
                  {formatDate(report.created_at)}
                </AppText>

                <Link
                  href={`/dashboard/reported-posts/${report.id}`}
                  style={{
                    textDecoration: "none",
                    fontFamily: FONT_FAMILY.primary,
                    fontSize: FONT_SIZES.small,
                    fontWeight: FONT_WEIGHT.primary.medium,
                    color: COLORS.link,
                  }}
                >
                  Granska
                </Link>
              </div>
            ))
          )}
        </div>

        {!error && totalReports > 0 && (
          <div
            style={{
              marginTop: SPACING.x5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: SPACING.x4,
              flexWrap: "wrap",
            }}
          >
            <AppText variant="caption" style={{ opacity: 0.6 }}>
              Visar {shownFrom}-{shownTo} av {totalReports} rapporter
            </AppText>

            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={canGoPrev ? buildPageHref(safePage - 1) : "#"}
                aria-disabled={!canGoPrev}
                style={{
                  pointerEvents: canGoPrev ? "auto" : "none",
                  opacity: canGoPrev ? 1 : 0.45,
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.borderSubtle}`,
                  background: COLORS.backgroundPrimary,
                  color: COLORS.textPrimary,
                  fontFamily: FONT_FAMILY.primary,
                  fontSize: FONT_SIZES.small,
                  fontWeight: FONT_WEIGHT.primary.medium,
                }}
              >
                Föregående
              </Link>
              <Link
                href={canGoNext ? buildPageHref(safePage + 1) : "#"}
                aria-disabled={!canGoNext}
                style={{
                  pointerEvents: canGoNext ? "auto" : "none",
                  opacity: canGoNext ? 1 : 0.45,
                  textDecoration: "none",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.borderSubtle}`,
                  background: COLORS.backgroundPrimary,
                  color: COLORS.textPrimary,
                  fontFamily: FONT_FAMILY.primary,
                  fontSize: FONT_SIZES.small,
                  fontWeight: FONT_WEIGHT.primary.medium,
                }}
              >
                Nästa
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
