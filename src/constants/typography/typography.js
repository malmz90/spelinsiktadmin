import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { FONT_FAMILY, FONT_WEIGHT } from "./fontFamily";
import { FONT_SIZES } from "./fontSizes";
import { LINE_HEIGHT } from "./lineHeight";
import { TYPOGRAPHY_BASE } from "./typographyBase";

export const TYPOGRAPHY = {
  pageTitle: {
    ...TYPOGRAPHY_BASE.h1,
    fontFamily: FONT_FAMILY.secondary,
    fontWeight: FONT_WEIGHT.secondary.medium,
    color: COLORS.primary,
  },
  pageSubtitle: {
    ...TYPOGRAPHY_BASE.h3,
    fontFamily: FONT_FAMILY.secondary,
    fontWeight: FONT_WEIGHT.secondary.medium,
    color: COLORS.primary,
  },
  cardHeading: {
    ...TYPOGRAPHY_BASE.h3,
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.semiBold,
    color: COLORS.primary,
  },
  body: {
    ...TYPOGRAPHY_BASE.body,
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.regular,
    color: COLORS.textPrimary,
  },
  bodyStrong: {
    ...TYPOGRAPHY_BASE.body,
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.semiBold,
    color: COLORS.textPrimary,
  },
  bodyLink: {
    ...TYPOGRAPHY_BASE.body,
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.semiBold,
    color: COLORS.accent,
  },
  caption: {
    ...TYPOGRAPHY_BASE.small,
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.regular,
    color: COLORS.textPrimary,
    marginBottom: FONT_SIZES.small,
  },
  captionStrong: {
    ...TYPOGRAPHY_BASE.small,
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.semiBold,
    color: COLORS.textPrimary,
  },
  lead: {
    ...TYPOGRAPHY_BASE.large,
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.regular,
    color: COLORS.textPrimary,
    marginBottom: FONT_SIZES.large,
  },
  leadStrong: {
    ...TYPOGRAPHY_BASE.large,
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.semiBold,
    color: COLORS.textPrimary,
  },
  sectionHeading: {
    ...TYPOGRAPHY_BASE.body,
    fontFamily: FONT_FAMILY.primary,
    fontWeight: FONT_WEIGHT.primary.semiBold,
    fontSize: FONT_SIZES.large,
    lineHeight: FONT_SIZES.body * LINE_HEIGHT.snug,
    color: COLORS.textPrimary,
    marginTop: SPACING.x2,
    marginBottom: SPACING.x3,
  },
};
