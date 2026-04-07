"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteUserAction } from "./actions";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT } from "@/constants";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        border: `1px solid ${COLORS.error}55`,
        background: `${COLORS.error}14`,
        color: COLORS.error,
        borderRadius: 8,
        padding: "8px 12px",
        cursor: pending ? "wait" : "pointer",
        fontFamily: FONT_FAMILY.primary,
        fontSize: FONT_SIZES.small,
        fontWeight: FONT_WEIGHT.primary.medium,
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? "Raderar användare..." : "Radera användare permanent"}
    </button>
  );
}

export default function DeleteUserModal({ userId, expectedDeleteToken }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          border: `1px solid ${COLORS.error}55`,
          background: `${COLORS.error}14`,
          color: COLORS.error,
          borderRadius: 8,
          padding: "8px 12px",
          cursor: "pointer",
          fontFamily: FONT_FAMILY.primary,
          fontSize: FONT_SIZES.small,
          fontWeight: FONT_WEIGHT.primary.medium,
        }}
      >
        Radera
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 200,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              background: COLORS.backgroundPrimary,
              border: `1px solid ${COLORS.borderSubtle}`,
              borderRadius: 14,
              padding: "18px 20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontFamily: FONT_FAMILY.primary,
                fontSize: FONT_SIZES.h3,
                fontWeight: FONT_WEIGHT.primary.bold,
                color: COLORS.textPrimary,
              }}
            >
              Bekräfta permanent radering
            </h3>

            <p
              style={{
                marginTop: 8,
                marginBottom: 12,
                fontFamily: FONT_FAMILY.primary,
                fontSize: FONT_SIZES.small,
                color: COLORS.textPrimary,
                opacity: 0.78,
                lineHeight: 1.45,
              }}
            >
              Det här tar bort användaren och relaterad data permanent. För att fortsätta, skriv exakt
              användarnamnet nedan.
            </p>

            <p
              style={{
                marginTop: 0,
                marginBottom: 10,
                fontFamily: FONT_FAMILY.primary,
                fontSize: FONT_SIZES.small,
                color: COLORS.textPrimary,
              }}
            >
              Bekräftelsetext: <strong>{expectedDeleteToken}</strong>
            </p>

            <form action={deleteUserAction}>
              <input type="hidden" name="userId" value={userId} />
              <input
                name="confirmText"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder={expectedDeleteToken}
                style={{
                  width: "100%",
                  marginBottom: 12,
                  border: `1px solid ${COLORS.borderSubtle}`,
                  background: COLORS.backgroundPrimary,
                  color: COLORS.textPrimary,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontFamily: FONT_FAMILY.primary,
                  fontSize: FONT_SIZES.small,
                }}
              />

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    border: `1px solid ${COLORS.borderSubtle}`,
                    background: COLORS.backgroundPrimary,
                    color: COLORS.textPrimary,
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontFamily: FONT_FAMILY.primary,
                    fontSize: FONT_SIZES.small,
                    fontWeight: FONT_WEIGHT.primary.medium,
                  }}
                >
                  Avbryt
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
