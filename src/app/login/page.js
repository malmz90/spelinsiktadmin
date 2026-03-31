import { Suspense } from "react";
import Image from "next/image";
import LoginForm from "./LoginForm";
import { COLORS, FONT_FAMILY, FONT_WEIGHT, FONT_SIZES, LINE_HEIGHT } from "@/constants";

export const metadata = {
  title: "Logga in – Spelinsikt Admin",
};

export default function LoginPage() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Left panel — branding */}
      <div
        style={{
          flex: "0 0 420px",
          background: COLORS.sidebarBg,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 40px",
        }}
        className="login-sidebar"
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 48,
            }}
          >
            <Image
              src="/Icon_spelinsikt.png"
              alt="Spelinsikt"
              width={36}
              height={36}
              style={{ flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: FONT_FAMILY.primary,
                fontWeight: FONT_WEIGHT.primary.bold,
                fontSize: FONT_SIZES.large,
                color: COLORS.sidebarText,
                letterSpacing: "-0.01em",
              }}
            >
              Spelinsikt Admin
            </span>
          </div>

          <h1
            style={{
              fontFamily: FONT_FAMILY.secondary,
              fontWeight: FONT_WEIGHT.secondary.medium,
              fontSize: FONT_SIZES.h2,
              lineHeight: `${FONT_SIZES.h2 * LINE_HEIGHT.tight}px`,
              color: COLORS.sidebarText,
              marginBottom: 16,
            }}
          >
            Välkommen tillbaka
          </h1>
          <p
            style={{
              fontFamily: FONT_FAMILY.primary,
              fontWeight: FONT_WEIGHT.primary.regular,
              fontSize: FONT_SIZES.body,
              lineHeight: `${FONT_SIZES.body * LINE_HEIGHT.normal}px`,
              color: COLORS.sidebarTextMuted,
              maxWidth: 280,
            }}
          >
            Logga in för att hantera spelinsikter, användare och innehåll.
          </p>
        </div>

        <p
          style={{
            fontFamily: FONT_FAMILY.primary,
            fontSize: FONT_SIZES.xSmall,
            color: COLORS.sidebarTextMuted,
          }}
        >
          © {new Date().getFullYear()} Spelinsikt. Alla rättigheter förbehållna.
        </p>
      </div>

      {/* Right panel — login form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.backgroundPrimary,
          padding: "48px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <h2
            style={{
              fontFamily: FONT_FAMILY.secondary,
              fontWeight: FONT_WEIGHT.secondary.medium,
              fontSize: FONT_SIZES.h2,
              lineHeight: `${FONT_SIZES.h2 * LINE_HEIGHT.tight}px`,
              color: COLORS.primary,
              marginBottom: 8,
            }}
          >
            Logga in
          </h2>
          <p
            style={{
              fontFamily: FONT_FAMILY.primary,
              fontSize: FONT_SIZES.body,
              color: COLORS.textPrimary,
              marginBottom: 36,
              opacity: 0.65,
            }}
          >
            Ange dina uppgifter nedan
          </p>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
