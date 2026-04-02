import Image from "next/image";
import Link from "next/link";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT } from "@/constants";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Användare", href: "/dashboard/users" },
  { label: "Rapporterade inlägg", href: "/dashboard/reported-posts" },
];

export default function DashboardSidebar({ user, activePage }) {
  return (
    <>
      <div style={{ width: 240, flexShrink: 0 }} />
      <aside
        style={{
          width: 240,
          background: COLORS.sidebarBg,
          display: "flex",
          flexDirection: "column",
          padding: "32px 0",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          overflowY: "auto",
          boxSizing: "border-box",
          zIndex: 30,
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
          {NAV_ITEMS.map(({ label, href }) => {
            const active = activePage === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "block",
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginBottom: 2,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  textDecoration: "none",
                  fontFamily: FONT_FAMILY.primary,
                  fontWeight: active
                    ? FONT_WEIGHT.primary.semiBold
                    : FONT_WEIGHT.primary.regular,
                  fontSize: FONT_SIZES.body,
                  color: active ? COLORS.sidebarText : COLORS.sidebarTextMuted,
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

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
    </>
  );
}
