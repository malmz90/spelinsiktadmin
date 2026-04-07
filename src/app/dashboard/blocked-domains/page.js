import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/authService";
import DashboardSidebar from "@/components/DashboardSidebar";
import AppText from "@/components/AppText";
import Link from "next/link";
import { fetchNextDnsDenylistPage } from "@/lib/nextDnsService";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT, SPACING } from "@/constants";
import AddBlockedDomainForm from "./AddBlockedDomainForm";

export const metadata = {
  title: "Blockerade domäner – Spelinsikt Admin",
};

const LOCAL_PAGE_SIZE = 10;

export default async function BlockedDomainsPage({ searchParams }) {
  const supabase = await createClient();
  const user = await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/login",
  });

  const { notice, tone, cursor: cursorParam, page: pageParam } = await searchParams;
  const noticeColor = tone === "error" ? COLORS.error : COLORS.primary;

  // cursor = NextDNS cursor for the current batch; page = local page within that batch
  const cursor = typeof cursorParam === "string" && cursorParam ? cursorParam : null;
  const localPage = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  let batchItems = [];
  let nextCursor = null;
  let fetchError = null;

  try {
    const result = await fetchNextDnsDenylistPage({ cursor });
    batchItems = result.items;
    nextCursor = result.nextCursor;
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Kunde inte hämta denylist från NextDNS.";
  }

  const totalLocalPages = Math.max(1, Math.ceil(batchItems.length / LOCAL_PAGE_SIZE));
  const safePage = Math.min(localPage, totalLocalPages);
  const from = (safePage - 1) * LOCAL_PAGE_SIZE;
  const denylist = batchItems.slice(from, from + LOCAL_PAGE_SIZE);

  const canGoPrev = safePage > 1 || cursor !== null;
  const canGoNext = safePage < totalLocalPages || nextCursor !== null;

  const buildHref = ({ page: p, cur }) => {
    const params = new URLSearchParams();
    if (cur) params.set("cursor", cur);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/dashboard/blocked-domains?${qs}` : "/dashboard/blocked-domains";
  };

  const prevHref = (() => {
    if (safePage > 1) return buildHref({ page: safePage - 1, cur: cursor });
    // first local page + we have a cursor = can't go back to prev NextDNS batch,
    // so just go to page 1 of current batch (already handled above) or root
    return "/dashboard/blocked-domains";
  })();

  const nextHref = (() => {
    if (safePage < totalLocalPages) return buildHref({ page: safePage + 1, cur: cursor });
    if (nextCursor) return buildHref({ page: 1, cur: nextCursor });
    return "#";
  })();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar user={user} activePage="/dashboard/blocked-domains" />

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
            Blockerade domäner
          </AppText>
          <div style={{ marginTop: 6 }}>
            <AppText variant="caption" style={{ opacity: 0.6 }}>
              Hantera NextDNS denylist för att blockera domäner i nätverket
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
            marginBottom: SPACING.x6,
            background: COLORS.backgroundPrimary,
            border: `1px solid ${COLORS.borderSubtle}`,
            borderRadius: 16,
            padding: "28px 32px",
          }}
        >
          <AppText as="h2" variant="bodyStrong" style={{ fontSize: FONT_SIZES.medium, marginBottom: 4 }}>
            Blockera domän
          </AppText>
          <AppText variant="caption" style={{ opacity: 0.55, marginBottom: SPACING.x6, display: "block" }}>
            Klistra in en domän eller full URL – vi sparar bara domänen.
          </AppText>
          <AddBlockedDomainForm />
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
              gridTemplateColumns: "1fr 130px",
              padding: "12px 24px",
              borderBottom: `1px solid ${COLORS.borderSubtle}`,
              gap: 16,
            }}
          >
            {["Domän", "Aktiv"].map((col) => (
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

          {fetchError ? (
            <div style={{ padding: "36px 24px", textAlign: "center" }}>
              <AppText variant="body" style={{ color: COLORS.error }}>
                {fetchError}
              </AppText>
            </div>
          ) : denylist.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <AppText variant="bodyStrong" style={{ opacity: 0.55 }}>
                Inga blockerade domäner hittades i NextDNS.
              </AppText>
            </div>
          ) : (
            denylist.map((item, index) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 130px",
                  padding: "14px 24px",
                  gap: 16,
                  alignItems: "center",
                  borderBottom:
                    index < denylist.length - 1 ? `1px solid ${COLORS.borderSubtle}` : "none",
                  background: index % 2 === 1 ? COLORS.backgroundSecondary : COLORS.backgroundPrimary,
                }}
              >
                <AppText variant="bodyStrong">{item.id}</AppText>
                <span
                  style={{
                    display: "inline-block",
                    width: "fit-content",
                    padding: "3px 10px",
                    borderRadius: 999,
                    fontFamily: FONT_FAMILY.primary,
                    fontSize: FONT_SIZES.xSmall,
                    fontWeight: FONT_WEIGHT.primary.semiBold,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    border: `1px solid ${item.active ? `${COLORS.primary}44` : COLORS.borderSubtle}`,
                    background: item.active ? `${COLORS.primary}15` : COLORS.backgroundPrimary,
                    color: item.active ? COLORS.primary : COLORS.textPrimary,
                    opacity: item.active ? 1 : 0.6,
                  }}
                >
                  {item.active ? "Aktiv" : "Inaktiv"}
                </span>
              </div>
            ))
          )}
        </div>

        {!fetchError && batchItems.length > 0 && (
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
              Visar {from + 1}–{from + denylist.length} av denna sida
            </AppText>

            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={canGoPrev ? prevHref : "#"}
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
                href={canGoNext ? nextHref : "#"}
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
