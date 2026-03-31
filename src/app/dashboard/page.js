import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware handles the unauthenticated case, but double-check here
  if (!user) redirect("/login");

  const admin = await isAdmin(supabase, user.id);

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
      {/* Sidebar */}
      <aside
        style={{
          flex: "0 0 240px",
          background: COLORS.sidebarBg,
          display: "flex",
          flexDirection: "column",
          padding: "32px 0",
        }}
      >
        <div style={{ padding: "0 24px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image
              src="/Icon_spelinsikt.png"
              alt="Spelinsikt"
              width={32}
              height={32}
              style={{ flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: FONT_FAMILY.primary,
                fontWeight: FONT_WEIGHT.primary.bold,
                fontSize: FONT_SIZES.body,
                color: COLORS.sidebarText,
              }}
            >
              Spelinsikt
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "0 12px" }}>
          {[
            { label: "Dashboard", active: true },
            { label: "Användare", active: false },
            { label: "Innehåll", active: false },
            { label: "Inställningar", active: false },
          ].map(({ label, active }) => (
            <div
              key={label}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 2,
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                cursor: "pointer",
                fontFamily: FONT_FAMILY.primary,
                fontWeight: active
                  ? FONT_WEIGHT.primary.semiBold
                  : FONT_WEIGHT.primary.regular,
                fontSize: FONT_SIZES.body,
                color: active ? COLORS.sidebarText : COLORS.sidebarTextMuted,
              }}
            >
              {label}
            </div>
          ))}
        </nav>

        {/* User info + sign out */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid rgba(255,255,255,0.08)`,
          }}
        >
          <p
            style={{
              fontFamily: FONT_FAMILY.primary,
              fontSize: FONT_SIZES.xSmall,
              color: COLORS.sidebarTextMuted,
              marginBottom: 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: FONT_FAMILY.primary,
                fontSize: FONT_SIZES.xSmall,
                fontWeight: FONT_WEIGHT.primary.medium,
                color: COLORS.sidebarTextMuted,
                padding: 0,
              }}
            >
              Logga ut
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          background: COLORS.backgroundSecondary,
          padding: "40px 48px",
          overflowY: "auto",
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
