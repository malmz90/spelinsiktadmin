import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/authService";
import { USERS_PAGE_SIZE, fetchUsersPage } from "@/lib/usersService";
import DashboardSidebar from "@/components/DashboardSidebar";
import AppText from "@/components/AppText";
import UserSearch from "./UserSearch";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT, SPACING } from "@/constants";

export const metadata = {
  title: "Användare – Spelinsikt Admin",
};

function RoleBadge({ role }) {
  const isAdminRole = role === "ADMIN";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: FONT_SIZES.xSmall,
        fontWeight: FONT_WEIGHT.primary.semiBold,
        fontFamily: FONT_FAMILY.primary,
        background: isAdminRole ? `${COLORS.primary}18` : `${COLORS.borderDefault}44`,
        color: isAdminRole ? COLORS.primary : COLORS.textPrimary,
        border: `1px solid ${isAdminRole ? `${COLORS.primary}33` : COLORS.borderSubtle}`,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
      }}
    >
      {role ?? "USER"}
    </span>
  );
}

function UserAvatar({ name, avatar }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: `2px solid ${COLORS.borderSubtle}`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: `${COLORS.primary}18`,
        border: `2px solid ${COLORS.primary}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: FONT_FAMILY.primary,
        fontWeight: FONT_WEIGHT.primary.semiBold,
        fontSize: FONT_SIZES.xSmall,
        color: COLORS.primary,
      }}
    >
      {initials}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function UsersPage({ searchParams }) {
  const supabase = await createClient();
  const user = await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/dashboard",
  });

  const { q, page: pageParam, notice, tone } = await searchParams;
  const search = q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const {
    users,
    error,
    totalUsers,
    safePage,
    canGoPrev,
    canGoNext,
    shownFrom,
    shownTo,
  } = await fetchUsersPage(supabase, {
    search,
    page,
    pageSize: USERS_PAGE_SIZE,
  });

  const buildPageHref = (nextPage) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/dashboard/users?${qs}` : "/dashboard/users";
  };

  // Keep URL page in sync with available data pages.
  if (page !== safePage) {
    redirect(buildPageHref(safePage));
  }

  const COL = {
    name: "220px",
    email: "1fr",
    role: "100px",
    municipality: "140px",
    joined: "120px",
    actions: "100px",
  };

  const gridTemplate = `${COL.name} ${COL.email} ${COL.role} ${COL.municipality} ${COL.joined} ${COL.actions}`;
  const noticeColor = tone === "error" ? COLORS.error : COLORS.primary;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar user={user} activePage="/dashboard/users" />

      <main
        style={{
          flex: 1,
          background: COLORS.backgroundSecondary,
          padding: "40px 48px",
          minWidth: 0,
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: SPACING.x8 }}>
          <AppText as="h1" variant="pageTitle">
            Användare
          </AppText>
          <div style={{ marginTop: 6 }}>
            <AppText variant="caption" style={{ opacity: 0.6 }}>
              Hantera och sök bland registrerade användare
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

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SPACING.x4,
            marginBottom: SPACING.x6,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 320px", maxWidth: 480 }}>
            <UserSearch defaultValue={search} />
          </div>

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
              {search ? "Resultat" : "Totalt"}
            </span>
            <span
              style={{
                fontFamily: FONT_FAMILY.primary,
                fontSize: FONT_SIZES.body,
                fontWeight: FONT_WEIGHT.primary.bold,
                color: COLORS.primary,
              }}
            >
              {totalUsers}
            </span>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            background: COLORS.backgroundPrimary,
            borderRadius: 16,
            border: `1px solid ${COLORS.borderSubtle}`,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridTemplate,
              padding: "12px 24px",
              borderBottom: `1px solid ${COLORS.borderSubtle}`,
              gap: 16,
            }}
          >
            {["Namn", "E-post", "Roll", "Kommun", "Registrerad", ""].map(
              (col) => (
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
              )
            )}
          </div>

          {/* Rows */}
          {error ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <AppText variant="body" style={{ color: COLORS.error }}>
                Kunde inte hämta användare. Kontrollera databasanslutningen.
              </AppText>
            </div>
          ) : !users || users.length === 0 ? (
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
                {search
                  ? `Inga användare matchade "${search}"`
                  : "Inga användare hittades"}
              </AppText>
              {search && (
                <AppText variant="caption" style={{ opacity: 0.4 }}>
                  Prova ett annat sökord
                </AppText>
              )}
            </div>
          ) : (
            users.map((u, index) => (
              <div
                key={u.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: gridTemplate,
                  padding: "14px 24px",
                  gap: 16,
                  alignItems: "center",
                  borderBottom:
                    index < users.length - 1
                      ? `1px solid ${COLORS.borderSubtle}`
                      : "none",
                  background:
                    index % 2 === 1
                      ? COLORS.backgroundSecondary
                      : COLORS.backgroundPrimary,
                  transition: "background 0.1s ease",
                }}
              >
                {/* Name + avatar */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}
                >
                  <UserAvatar name={u.name} avatar={u.avatar} />
                  <div style={{ minWidth: 0 }}>
                    <AppText
                      variant="bodyStrong"
                      numberOfLines={1}
                      style={{ fontSize: FONT_SIZES.small }}
                    >
                      {u.name || "—"}
                    </AppText>
                    {u.age && (
                      <AppText
                        variant="caption"
                        style={{ opacity: 0.45, fontSize: FONT_SIZES.tiny, marginTop: 1 }}
                      >
                        {u.age} år
                      </AppText>
                    )}
                  </div>
                </div>

                {/* Email */}
                <AppText
                  variant="body"
                  numberOfLines={1}
                  style={{ fontSize: FONT_SIZES.small, opacity: 0.75 }}
                >
                  {u.email || "—"}
                </AppText>

                {/* Role badge */}
                <div>
                  <RoleBadge role={u.role} />
                </div>

                {/* Municipality */}
                <AppText
                  variant="body"
                  numberOfLines={1}
                  style={{ fontSize: FONT_SIZES.small, opacity: 0.65 }}
                >
                  {u.municipality || "—"}
                </AppText>

                {/* Joined date */}
                <AppText
                  variant="caption"
                  style={{ fontSize: FONT_SIZES.xSmall, opacity: 0.55 }}
                >
                  {formatDate(u.created_at)}
                </AppText>

                <Link
                  href={`/dashboard/users/${u.id}`}
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

        {/* Pagination */}
        {!error && totalUsers > 0 && (
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
              Visar {shownFrom}-{shownTo} av {totalUsers} användare
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
