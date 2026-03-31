"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AppInput from "@/components/AppInput";
import AppButton from "@/components/AppButton";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT, SPACING } from "@/constants";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    callbackError ? "Inloggningslänken var ogiltig eller har gått ut. Försök igen." : null
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Fyll i e-postadress och lösenord.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setLoading(false);
      setError("Fel e-postadress eller lösenord.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: SPACING.x5 }}>
        <AppInput
          id="email"
          name="email"
          label="E-postadress"
          type="email"
          value={email}
          onChangeText={setEmail}
          placeholder="din@email.se"
          autoComplete="email"
          required
        />

        <AppInput
          id="password"
          name="password"
          label="Lösenord"
          password
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: FONT_SIZES.small,
              fontFamily: FONT_FAMILY.primary,
              fontWeight: FONT_WEIGHT.primary.medium,
              color: COLORS.errorText,
              backgroundColor: COLORS.errorSurface,
            }}
          >
            {error}
          </div>
        )}

        <AppButton type="submit" loading={loading}>
          Logga in
        </AppButton>
      </div>
    </form>
  );
}
