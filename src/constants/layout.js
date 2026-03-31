import { SPACING } from "./spacing";

const BASE_SPACING = SPACING.x1;

export const BORDER_RADIUS = {
  x0: 0,
  x1: BASE_SPACING * 1,
  x2: BASE_SPACING * 2,
  x3: BASE_SPACING * 3,
  x4: BASE_SPACING * 4,
  x5: BASE_SPACING * 5,
  x6: BASE_SPACING * 6,
  x8: BASE_SPACING * 8,
  x10: BASE_SPACING * 10,
  x12: BASE_SPACING * 12,
  x16: BASE_SPACING * 16,
  round: 9999,
};

export const OPACITY = {
  disabled: 0.5,
  hover: 0.8,
  pressed: 0.6,
};

export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
};
