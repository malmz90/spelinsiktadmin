import { createClient } from "@/lib/supabase/server";
import { requireAdminUser } from "@/lib/authService";
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await requireAdminUser(supabase, {
    loginRedirect: "/login",
    notAdminRedirect: "/login",
  });

  const [{ count: usersCount }, { count: reportedPostsCount }] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("post_reports").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Användare", value: usersCount ?? 0 },
    { label: "Rapporterade inlägg", value: reportedPostsCount ?? 0 },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar user={user} activePage="/dashboard" />

      {/* Main content */}
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
