import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/authService";
import { fetchSavingsStats } from "@/lib/usersService";
import DashboardSidebar from "@/components/DashboardSidebar";
import {
  COLORS,
  FONT_FAMILY,
  FONT_WEIGHT,
  FONT_SIZES,
  LINE_HEIGHT,
  SPACING,
} from "@/constants";

export const metadata = {
  title: "Dashboard – Spelinsikt Admin",
};

function formatSEK(amount) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/login",
  });

  const [
    { count: usersCount },
    { count: reportedPostsCount },
    savings,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("post_reports").select("id", { count: "exact", head: true }),
    fetchSavingsStats(supabase),
  ]);

  const stats = [
    { label: "Användare", value: usersCount ?? 0 },
    { label: "Rapporterade inlägg", value: reportedPostsCount ?? 0 },
    { label: "Genomsnitt sparat / person", value: formatSEK(savings.averageSavedSEK) },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar user={user} activePage="/dashboard" />

      <main
        style={{
          flex: 1,
          background: COLORS.backgroundSecondary,
          padding: "40px 48px",
        }}
      >
        <div style={{ marginBottom: SPACING.x8 }}>
          <h1
            style={{
              fontFamily: FONT_FAMILY.secondary,
              fontWeight: FONT_WEIGHT.secondary.medium,
              fontSize: FONT_SIZES.h1,
              lineHeight: `${FONT_SIZES.h1 * LINE_HEIGHT.extraTight}px`,
              color: COLORS.primary,
              marginBottom: 8,
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              fontFamily: FONT_FAMILY.primary,
              fontSize: FONT_SIZES.body,
              color: COLORS.textPrimary,
              opacity: 0.65,
            }}
          >
            Välkommen, {user.email}
          </p>
        </div>

        {/* Hero savings card */}
        <div
          style={{
            background: COLORS.primary,
            borderRadius: 16,
            padding: "32px 36px",
            marginBottom: SPACING.x6,
          }}
        >
          <p
            style={{
              fontFamily: FONT_FAMILY.primary,
              fontSize: FONT_SIZES.small,
              fontWeight: FONT_WEIGHT.primary.semiBold,
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            Totalt sparat av alla användare
          </p>
          <p
            style={{
              fontFamily: FONT_FAMILY.secondary,
              fontWeight: FONT_WEIGHT.secondary.bold,
              fontSize: FONT_SIZES.hero1,
              lineHeight: 1,
              color: COLORS.textInverse,
              letterSpacing: "-0.02em",
            }}
          >
            {formatSEK(savings.totalSavedSEK)}
          </p>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: SPACING.x5,
          }}
        >
          {stats.map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: COLORS.backgroundPrimary,
                borderRadius: 12,
                padding: "24px",
                border: `1px solid ${COLORS.borderSubtle}`,
              }}
            >
              <p
                style={{
                  fontFamily: FONT_FAMILY.primary,
                  fontSize: FONT_SIZES.small,
                  fontWeight: FONT_WEIGHT.primary.medium,
                  color: COLORS.textPrimary,
                  opacity: 0.55,
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontFamily: FONT_FAMILY.primary,
                  fontSize: FONT_SIZES.h2,
                  fontWeight: FONT_WEIGHT.primary.bold,
                  color: COLORS.primary,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
