import { createClient } from "@/lib/supabase/server";
import { hasAdminAccess, requireAuthenticatedUser } from "@/lib/authService";
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
  const user = await requireAuthenticatedUser(supabase, "/login");
  const admin = await hasAdminAccess(supabase, user.id);

  if (!admin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.backgroundSecondary,
          fontFamily: FONT_FAMILY.primary,
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "48px 40px",
            background: COLORS.backgroundPrimary,
            borderRadius: 16,
            border: `1px solid ${COLORS.borderSubtle}`,
            maxWidth: 400,
          }}
        >
          <p
            style={{
              fontSize: FONT_SIZES.h3,
              fontWeight: FONT_WEIGHT.primary.bold,
              color: COLORS.error,
              marginBottom: 12,
            }}
          >
            Ingen behörighet
          </p>
          <p
            style={{
              fontSize: FONT_SIZES.body,
              color: COLORS.textPrimary,
              opacity: 0.65,
              marginBottom: 24,
            }}
          >
            Ditt konto ({user.email}) har inte administratörsbehörighet.
          </p>
          <a
            href="/login"
            style={{
              fontSize: FONT_SIZES.small,
              fontWeight: FONT_WEIGHT.primary.medium,
              color: COLORS.link,
            }}
          >
            Logga ut och försök med ett annat konto
          </a>
        </div>
      </div>
    );
  }

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
          {[
            { label: "Användare", value: "—" },
            { label: "Aktiva sessioner", value: "—" },
            { label: "Innehållsposter", value: "—" },
            { label: "Senaste aktivitet", value: "—" },
          ].map(({ label, value }) => (
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
