"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  FONT_WEIGHT,
  LINE_HEIGHT,
  OPACITY,
  SPACING,
} from "@/constants";
import styles from "./styles.module.css";

const DEFAULT_VARIANT = "primary";
const DEFAULT_SIZE = "large";

function getPressedBackground(variant) {
  switch (variant) {
    case "primary":
      return COLORS.primaryPressed;
    case "secondary":
      return COLORS.secondaryPressed;
    case "accent":
      return COLORS.accentPressed;
    case "social":
      return COLORS.backgroundPrimaryPressed;
    case "overlay":
      return COLORS.overlayPressed;
    case "ghost":
      return "rgba(0,0,0,0.11)";
    default:
      return undefined;
  }
}

function getBaseBackground(variant) {
  switch (variant) {
    case "primary":
      return COLORS.primary;
    case "secondary":
      return COLORS.secondary;
    case "accent":
      return COLORS.accent;
    case "social":
    case "overlay":
      return COLORS.overlayBackground;
    case "ghost":
      return "transparent";
    default:
      return COLORS.primary;
  }
}

function getTextColor(variant) {
  switch (variant) {
    case "social":
      return "#000000";
    case "ghost":
      return COLORS.textSecondary;
    case "overlay":
      return COLORS.textPrimary;
    default:
      return COLORS.textInverse;
  }
}

function getSpinnerColor(variant) {
  switch (variant) {
    case "social":
    case "ghost":
    case "overlay":
      return "#000000";
    default:
      return "#FFFFFF";
  }
}

function getSizeStyle(size) {
  if (size === "small") {
    return {
      width: "auto",
      paddingInline: SPACING.x6,
      alignSelf: "flex-start",
    };
  }
  return { width: "100%" };
}

export default function AppButton({
  children,
  onPress,
  href,
  variant = DEFAULT_VARIANT,
  size = DEFAULT_SIZE,
  leftIcon,
  rightIcon,
  disabled = false,
  loading = false,
  style,
  type = "button",
}) {
  const [isPressed, setIsPressed] = useState(false);
  const isDisabled = disabled || loading;

  const buttonStyle = useMemo(() => {
    const backgroundColor =
      isPressed && !isDisabled
        ? getPressedBackground(variant) || getBaseBackground(variant)
        : getBaseBackground(variant);

    return {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      borderRadius: BORDER_RADIUS.round,
      paddingBlock: SPACING.x4,
      paddingInline: SPACING.x4,
      backgroundColor,
      opacity: isDisabled ? OPACITY.disabled : 1,
      border:
        variant === "ghost"
          ? `1px solid ${COLORS.borderFocus}`
          : variant === "overlay"
            ? `1px solid ${COLORS.overlayBorderSubtle}`
            : "none",
      ...getSizeStyle(size),
      ...style,
    };
  }, [isPressed, isDisabled, variant, size, style]);

  const labelStyle = {
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.semiBold,
    fontSize: FONT_SIZES.body,
    lineHeight: `${FONT_SIZES.body * LINE_HEIGHT.tight}px`,
    color: getTextColor(variant),
    display: "inline-flex",
    alignItems: "center",
  };

  const sharedProps = {
    className: styles.button,
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
    style: buttonStyle,
  };

  const content = loading ? (
    <>
      <span
        className={styles.spinner}
        style={{ color: getSpinnerColor(variant), marginRight: SPACING.x2 }}
        aria-hidden="true"
      />
      <span style={labelStyle}>Laddar...</span>
    </>
  ) : (
    <>
      {leftIcon ? (
        <span style={{ marginRight: SPACING.x2, display: "inline-flex" }}>
          {leftIcon}
        </span>
      ) : null}

      {typeof children === "string" ? (
        <span style={labelStyle}>{children}</span>
      ) : (
        children
      )}

      {rightIcon ? (
        <span style={{ marginLeft: SPACING.x2, display: "inline-flex" }}>
          {rightIcon}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        onClick={(event) => {
          if (isDisabled) {
            event.preventDefault();
          }
        }}
        {...sharedProps}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onPress}
      disabled={isDisabled}
      {...sharedProps}
    >
      {content}
    </button>
  );
}
