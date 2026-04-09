"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { addBlockedDomainAction, addBlockedDomainsBulkAction } from "./actions";
import { COLORS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHT } from "@/constants";

function SubmitButton({ idleLabel, pendingLabel }) {
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
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

export default function AddBlockedDomainForm() {
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <>
      <form
        action={addBlockedDomainAction}
        style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}
      >
        <div
          style={{
            flex: "1 1 320px",
            minWidth: 260,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
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
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            style={{
              whiteSpace: "nowrap",
              border: `1px solid ${COLORS.borderSubtle}`,
              background: COLORS.backgroundPrimary,
              color: COLORS.textPrimary,
              borderRadius: 10,
              padding: "12px 16px",
              cursor: "pointer",
              fontFamily: FONT_FAMILY.primary,
              fontSize: FONT_SIZES.small,
              fontWeight: FONT_WEIGHT.primary.semiBold,
            }}
          >
            Bulk blockera
          </button>
          <SubmitButton idleLabel="Blockera domän" pendingLabel="Lägger till..." />
        </div>
      </form>

      {bulkOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setBulkOpen(false)}
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
              maxWidth: 700,
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
              Bulk blockering
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
              Klistra in flera domäner eller URL:er. Du kan separera med komma, semikolon
              eller radbrytning.
            </p>

            <form action={addBlockedDomainsBulkAction}>
              <textarea
                name="domains"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder={"unibet.com,\nbet365.com,\nhttps://casino.com/path"}
                style={{
                  width: "100%",
                  minHeight: 220,
                  marginBottom: 12,
                  border: `1px solid ${COLORS.borderSubtle}`,
                  background: COLORS.backgroundSecondary,
                  color: COLORS.textPrimary,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontFamily: FONT_FAMILY.primary,
                  fontSize: FONT_SIZES.small,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setBulkOpen(false)}
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
                <SubmitButton idleLabel="Lägg till alla" pendingLabel="Lägger till..." />
              </div>
            </form>
          </div>
      </div>
      ) : null}
    </>
  );
}
