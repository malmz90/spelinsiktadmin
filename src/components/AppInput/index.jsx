"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import {
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  FONT_WEIGHT,
} from "@/constants";
import styles from "./styles.module.css";

export default function AppInput({
  value,
  label,
  disabled = false,
  onChange,
  onChangeText,
  placeholder = "",
  type = "text",
  variant = "primary",
  password = false,
  feedback,
  signup = false,
  style,
  id,
  name,
  required,
  autoComplete,
  minLength,
}) {
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const isOverlay = variant === "overlay";
  const inputType = password ? (isPasswordVisible ? "text" : "password") : type;

  const handleChange = (event) => {
    onChange?.(event);
    onChangeText?.(event.target.value);
  };

  return (
    <div style={style}>
      {label && (
        <label
          htmlFor={id}
          className={styles.label}
          style={{
            color: isOverlay ? COLORS.textInverse : COLORS.textSecondary,
            fontFamily: FONT_FAMILY.primary,
          }}
        >
          {label}
        </label>
      )}

      <div
        className={styles.inputRow}
        style={{
          "--border-color": isOverlay ? "#ffffff" : COLORS.borderDefault,
          "--border-width": isOverlay ? "2px" : "1px",
          "--border-focus-color": isOverlay
            ? COLORS.accent
            : COLORS.borderFocus,
          "--focus-ring-color": isOverlay
            ? `${COLORS.accent}33`
            : `${COLORS.borderFocus}22`,
        }}
      >
        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          autoCorrect="off"
          className={styles.input}
          style={{
            color: disabled ? COLORS.textDisabled : COLORS.textPrimary,
            fontFamily: FONT_FAMILY.primary,
            fontSize: FONT_SIZES.body,
            fontWeight: FONT_WEIGHT.primary.regular,
          }}
        />

        {password && (
          <button
            type="button"
            onClick={() => setPasswordVisible((prev) => !prev)}
            className={styles.eyeButton}
            tabIndex={-1}
            aria-label={isPasswordVisible ? "Dölj lösenord" : "Visa lösenord"}
          >
            {isPasswordVisible ? (
              <EyeIcon size={20} color={COLORS.textSecondary} />
            ) : (
              <EyeSlashIcon size={20} color={COLORS.textSecondary} />
            )}
          </button>
        )}
      </div>

      {feedback?.feedbackMsg && (
        <div
          className={styles.feedback}
          style={{
            color:
              feedback.feedbackType === "success"
                ? COLORS.success
                : feedback.feedbackType === "error"
                  ? COLORS.error
                  : feedback.feedbackType === "warning"
                    ? COLORS.warning
                    : COLORS.info,
            backgroundColor:
              feedback.feedbackType === "success"
                ? COLORS.successSurface
                : feedback.feedbackType === "error"
                  ? COLORS.errorSurface
                  : feedback.feedbackType === "warning"
                    ? COLORS.warningSurface
                    : COLORS.infoSurface,
            fontFamily: FONT_FAMILY.primary,
          }}
        >
          {feedback.feedbackMsg}
        </div>
      )}

      {password && signup ? (
        <span
          className={styles.subtitle}
          style={{
            color: isOverlay ? COLORS.textInverse : COLORS.textSecondary,
            fontFamily: FONT_FAMILY.primary,
          }}
        >
          Lösenordet måste vara minst 6 tecken
        </span>
      ) : type === "email" && signup ? (
        <span
          className={styles.subtitle}
          style={{
            color: isOverlay ? COLORS.textInverse : COLORS.textSecondary,
            fontFamily: FONT_FAMILY.primary,
          }}
        >
          Vi delar aldrig din e-postadress
        </span>
      ) : null}
    </div>
  );
}
