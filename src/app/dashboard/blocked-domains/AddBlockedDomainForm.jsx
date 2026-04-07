"use client";

import { useFormStatus } from "react-dom";
import { addBlockedDomainAction } from "./actions";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT } from "@/constants";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        alignSelf: "flex-end",
        whiteSpace: "nowrap",
        border: `1px solid ${COLORS.primary}55`,
        background: `${COLORS.primary}15`,
        color: COLORS.primary,
        borderRadius: 10,
        padding: "12px 24px",
        cursor: pending ? "wait" : "pointer",
        fontFamily: FONT_FAMILY.primary,
        fontSize: FONT_SIZES.small,
        fontWeight: FONT_WEIGHT.primary.semiBold,
        opacity: pending ? 0.7 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {pending ? "Lägger till..." : "Blockera domän"}
    </button>
  );
}

export default function AddBlockedDomainForm() {
  return (
    <form
      action={addBlockedDomainAction}
      style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}
    >
      <div style={{ flex: "1 1 320px", minWidth: 260, display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          htmlFor="domain-input"
          style={{
            fontFamily: FONT_FAMILY.primary,
            fontSize: FONT_SIZES.xSmall,
            fontWeight: FONT_WEIGHT.primary.semiBold,
            color: COLORS.textPrimary,
            opacity: 0.55,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Domän eller URL
        </label>
        <input
          id="domain-input"
          name="domain"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="t.ex. badsite.com eller https://badsite.com/path"
          style={{
            border: `1px solid ${COLORS.borderSubtle}`,
            background: COLORS.backgroundSecondary,
            color: COLORS.textPrimary,
            borderRadius: 10,
            padding: "12px 14px",
            fontFamily: FONT_FAMILY.primary,
            fontSize: FONT_SIZES.body,
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>
      <SubmitButton />
    </form>
  );
}
