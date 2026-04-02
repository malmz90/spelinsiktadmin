"use client";

import { useFormStatus } from "react-dom";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT } from "@/constants";

export default function ConfirmSubmitButton({
  children,
  confirmText,
  pendingText = "Sparar...",
  variant = "default",
}) {
  const { pending } = useFormStatus();

  const isDanger = variant === "danger";
  const isSecondary = variant === "secondary";

  const handleClick = (event) => {
    if (!confirmText) return;
    const confirmed = window.confirm(confirmText);
    if (!confirmed) {
      event.preventDefault();
    }
  };

  return (
    <button
      type="submit"
      onClick={handleClick}
      disabled={pending}
      style={{
        border: `1px solid ${
          isDanger ? `${COLORS.error}55` : isSecondary ? COLORS.borderSubtle : `${COLORS.primary}55`
        }`,
        background: isDanger
          ? `${COLORS.error}14`
          : isSecondary
            ? COLORS.backgroundPrimary
            : `${COLORS.primary}14`,
        color: isDanger ? COLORS.error : COLORS.textPrimary,
        borderRadius: 8,
        padding: "8px 12px",
        cursor: pending ? "wait" : "pointer",
        fontFamily: FONT_FAMILY.primary,
        fontSize: FONT_SIZES.small,
        fontWeight: FONT_WEIGHT.primary.medium,
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
