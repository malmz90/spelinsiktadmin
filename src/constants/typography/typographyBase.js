import { FONT_SIZES } from "./fontSizes";
import { LINE_HEIGHT } from "./lineHeight";

export const TYPOGRAPHY_BASE = {
  hero1: {
    fontSize: FONT_SIZES.hero1,
    lineHeight: FONT_SIZES.hero1 * LINE_HEIGHT.extraTight,
    letterSpacing: FONT_SIZES.hero1 * -0.01,
  },
  hero2: {
    fontSize: FONT_SIZES.hero2,
    lineHeight: FONT_SIZES.hero2 * LINE_HEIGHT.tight,
    letterSpacing: FONT_SIZES.hero2 * -0.01,
  },
  h1: {
    fontSize: FONT_SIZES.h1,
    lineHeight: FONT_SIZES.h1 * LINE_HEIGHT.extraTight,
    letterSpacing: FONT_SIZES.h1 * -0.005,
  },
  h2: {
    fontSize: FONT_SIZES.h2,
    lineHeight: FONT_SIZES.h2 * LINE_HEIGHT.tight,
    letterSpacing: FONT_SIZES.h2 * -0.005,
  },
  h3: {
    fontSize: FONT_SIZES.h3,
    lineHeight: FONT_SIZES.h3 * LINE_HEIGHT.tight,
    letterSpacing: FONT_SIZES.h3 * -0.005,
  },
  large: {
    fontSize: FONT_SIZES.large,
    lineHeight: FONT_SIZES.large * LINE_HEIGHT.snug,
    letterSpacing: 0,
  },
  body: {
    fontSize: FONT_SIZES.body,
    lineHeight: FONT_SIZES.body * LINE_HEIGHT.normal,
    letterSpacing: 0,
  },
  small: {
    fontSize: FONT_SIZES.small,
    lineHeight: FONT_SIZES.small * LINE_HEIGHT.relaxed,
    letterSpacing: 0,
  },
  xSmall: {
    fontSize: FONT_SIZES.xSmall,
    lineHeight: FONT_SIZES.xSmall * LINE_HEIGHT.extraRelaxed,
    letterSpacing: 0,
  },
  tiny: {
    fontSize: FONT_SIZES.tiny,
    lineHeight: FONT_SIZES.tiny * LINE_HEIGHT.relaxed,
    letterSpacing: 0,
  },
};
