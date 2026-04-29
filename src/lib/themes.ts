/**
 * Theme color palettes for gender-based personalization.
 * The accent color is the only thing that changes — backgrounds and structural colors stay the same.
 */

/** Default accent for unauthenticated / UNSPECIFIED users */
export const DEFAULT_THEME_COLOR = "#B0C4DE";

/** Curated accent palette for male-identifying users */
export const MALE_THEME_COLORS = [
  "#B0C4DE", // Light Steel Blue
  "#B0E0E6", // Powder Blue
  "#D2B48C", // Tan
  "#98FB98", // Pale Green
  "#B0C4DE", // Light Steel Blue
  "#778899", // Light Slate Gray
];

/** Curated accent palette for female-identifying users */
export const FEMALE_THEME_COLORS = [
  "#FFB3BA", // Light Pink
  "#FFA07A", // Light Salmon
  "#F5DEB3", // Wheat
  "#B0C4DE", // Light Steel Blue
  "#E5E4E2", // Platinum
  "#B0C4DE", // Light Steel Blue
];

/**
 * Pick a random theme accent color based on the user's gender.
 * Falls back to DEFAULT_THEME_COLOR for OTHER / UNSPECIFIED.
 */
export function getRandomThemeColor(gender: string): string {
  if (gender === "FEMALE") {
    return FEMALE_THEME_COLORS[Math.floor(Math.random() * FEMALE_THEME_COLORS.length)];
  }
  if (gender === "MALE") {
    return MALE_THEME_COLORS[Math.floor(Math.random() * MALE_THEME_COLORS.length)];
  }
  return DEFAULT_THEME_COLOR;
}

/**
 * Generate a gradient CSS string for the app background.
 * Female: gradient goes top-left → bottom-right (softer, diagonal)
 * Male:   gradient goes bottom-left → top-right (strong, upward)
 */
export function getThemeGradient(color: string, gender?: string | null): string {
  const direction = gender === "FEMALE" ? "135deg" : "225deg";
  return `linear-gradient(${direction}, #ffffff 0%, ${color}60 50%, #ffffff 100%)`;
}
