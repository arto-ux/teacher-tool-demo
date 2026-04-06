/**
 * Koreez typography scale (design system).
 *
 * Title: H1 38/46, H2 30/38, H3 24/32, H4 20/28, H5 16/24
 * Extra large (intro / lead): 20/28 — same metrics as H4; Strong = +fontWeight 600
 * Large: 16/24 | Base: 14/22 | Small: 12/20
 *
 * `medalEmoji`: 48px square line — tier medal emojis only (not part of Figma text ramp).
 *
 * Use `TYPO` / `typoStyle` / `typoStrong` for inline styles.
 * Use `getKoreezAntdFontTokens()` for root `ConfigProvider` (Ant expects unitless heading lineHeights = lh/px).
 */

export const KOREEZ_FONT_FAMILY = "'Mardoto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/** @param {number} sizePx @param {number} linePx */
function step(sizePx, linePx) {
  return { fontSize: sizePx, lineHeight: `${linePx}px` };
}

const _h1 = step(38, 46);
const _h2 = step(30, 38);
const _h3 = step(24, 32);
const _h4 = step(20, 28);
const _h5 = step(16, 24);
const _large = step(16, 24);
const _base = step(14, 22);
const _small = step(12, 20);
const _medalEmoji = step(48, 48);

export const TYPO = Object.freeze({
  heading1: _h1,
  heading2: _h2,
  heading3: _h3,
  heading4: _h4,
  extraLarge: _h4,
  heading5: _h5,
  large: _large,
  base: _base,
  small: _small,
  medalEmoji: _medalEmoji,
});

/** @typedef {keyof typeof TYPO} TypoKey */

/**
 * Spreadable React style object for a scale step.
 * @param {TypoKey} key
 */
export function typoStyle(key) {
  const s = TYPO[key];
  if (!s) throw new Error(`Unknown typography key: ${key}`);
  return { ...s };
}

/**
 * Same as `typoStyle` plus semibold (Ant “strong” emphasis).
 * @param {TypoKey} key
 */
export function typoStrong(key) {
  return { ...typoStyle(key), fontWeight: 600 };
}

/**
 * Partial Ant Design `theme.token` font map for `ConfigProvider`.
 * Heading `lineHeightHeadingN` are unitless multipliers (linePx / sizePx).
 */
export function getKoreezAntdFontTokens() {
  return {
    fontFamily: KOREEZ_FONT_FAMILY,
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    lineHeight: 22 / 14,
    lineHeightSM: 20 / 12,
    lineHeightLG: 24 / 16,
    lineHeightHeading1: 46 / 38,
    lineHeightHeading2: 38 / 30,
    lineHeightHeading3: 32 / 24,
    lineHeightHeading4: 28 / 20,
    lineHeightHeading5: 24 / 16,
  };
}
