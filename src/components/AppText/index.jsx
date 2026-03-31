import {
  COLORS,
  FONT_FAMILY,
  FONT_WEIGHT,
  LINE_HEIGHT,
  setSpacing,
  TYPOGRAPHY,
  TYPOGRAPHY_BASE,
} from "@/constants";

export default function AppText({
  as: Component = "span",
  variant,
  family = "primary",
  weight = "regular",
  size = "body",
  lineHeight = "auto",
  letterSpacing = "auto",
  color,
  textTransform = "none",
  align = "left",
  spacingTop = 0,
  spacingBottom = 0,
  indent = 0,
  numberOfLines,
  ellipsizeMode = "tail",
  style,
  children,
}) {
  const variantStyles = variant ? TYPOGRAPHY[variant] : null;
  const variantFontFamily = variantStyles?.fontFamily;
  const fontFamily = variantFontFamily || FONT_FAMILY[family] || FONT_FAMILY.primary;
  const fontWeight = variantStyles?.fontWeight || FONT_WEIGHT[family]?.[weight] || 400;
  const baseSize = TYPOGRAPHY_BASE[size] || TYPOGRAPHY_BASE.body;
  const fontSize = variantStyles?.fontSize || baseSize.fontSize;

  const baseLineHeight = variantStyles?.lineHeight || baseSize.lineHeight;
  const baseLetterSpacing = variantStyles?.letterSpacing || baseSize.letterSpacing;

  const calculatedLineHeight =
    lineHeight === "auto" ? baseLineHeight : fontSize * (LINE_HEIGHT[lineHeight] || 1.4);

  const calculatedLetterSpacing =
    letterSpacing === "auto" ? baseLetterSpacing : fontSize * letterSpacing;

  const effectiveColor = color || variantStyles?.color || COLORS.textPrimary;

  const marginTop =
    spacingTop !== 0 ? setSpacing(spacingTop) : variantStyles?.marginTop;
  const marginBottom =
    spacingBottom !== 0 ? setSpacing(spacingBottom) : variantStyles?.marginBottom;
  const paddingLeft =
    indent !== 0 ? setSpacing(indent) : variantStyles?.paddingLeft;

  const clampStyles =
    typeof numberOfLines === "number"
      ? {
          overflow: "hidden",
          textOverflow: ellipsizeMode === "clip" ? "clip" : "ellipsis",
          ...(numberOfLines === 1
            ? {
                whiteSpace: "nowrap",
              }
            : {
                display: "-webkit-box",
                WebkitLineClamp: numberOfLines,
                WebkitBoxOrient: "vertical",
              }),
        }
      : null;

  const textStyle = {
    fontFamily,
    fontWeight,
    fontSize,
    lineHeight: calculatedLineHeight + "px",
    letterSpacing: calculatedLetterSpacing + "px",
    color: effectiveColor,
    textTransform,
    textAlign: align,
    ...clampStyles,
    ...style,
  };

  const textContent = (
    <Component style={textStyle}>
      {children}
    </Component>
  );

  if (marginTop || marginBottom || paddingLeft) {
    return (
      <div
        style={{
          marginTop,
          marginBottom,
          paddingLeft,
        }}
      >
        {textContent}
      </div>
    );
  }

  return textContent;
}
