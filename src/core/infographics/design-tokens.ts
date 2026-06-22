import type { InfographicStyle } from "./types";

/** Coherent design system used by the canvas renderer. Sizes are for a 900px
 *  reference width and scaled at render time. */
export type InfographicDesignTokens = {
  palette: {
    background: string;
    surface: string;
    surfaceMuted: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentSoft: string;
  };
  typography: {
    headlineSize: number;
    subheadlineSize: number;
    blockTitleSize: number;
    fontFamily: string;
    fontWeight: number;
  };
  spacing: {
    pagePadding: number;
    blockGap: number;
    blockPadding: number;
  };
  radius: {
    card: number;
    chip: number;
  };
  shadow: {
    soft: string;
    medium: string;
  };
};

export type BackgroundMode = "light" | "dark";

const FONT_FAMILY =
  '"Segoe UI", -apple-system, system-ui, Roboto, "Helvetica Neue", Arial, sans-serif';

/** Restrained, tasteful accents per style (NO loud default purple). */
const STYLE_ACCENT: Record<Exclude<InfographicStyle, "auto">, string> = {
  minimal: "#475569", // slate/graphite
  premium: "#9a7b4f", // muted gold
  bright: "#e11d48", // confident red
  soft: "#c98aa6", // soft rose
  dark: "#7c8aa3", // cool grey-blue
};

/**
 * Build tokens from the chosen style and the background brightness of the zone
 * where text/cards will sit. `accentOverride` lets the renderer inject an accent
 * sampled from the image palette so colours feel native to the photo.
 */
export function buildTokens(
  style: Exclude<InfographicStyle, "auto">,
  mode: BackgroundMode,
  accentOverride?: string | null,
): InfographicDesignTokens {
  const accent = accentOverride || STYLE_ACCENT[style] || "#475569";

  const palette =
    mode === "light"
      ? {
          background: "#f5f5f4",
          surface: "rgba(255,255,255,0.82)",
          surfaceMuted: "rgba(255,255,255,0.62)",
          textPrimary: "#15181f",
          textSecondary: "#4b5563",
          accent,
          accentSoft: hexToRgba(accent, 0.16),
        }
      : {
          background: "#0e1116",
          surface: "rgba(18,22,30,0.55)",
          surfaceMuted: "rgba(18,22,30,0.4)",
          textPrimary: "#ffffff",
          textSecondary: "rgba(255,255,255,0.82)",
          accent,
          accentSoft: hexToRgba(accent, 0.28),
        };

  return {
    palette,
    typography: {
      headlineSize: 62,
      subheadlineSize: 30,
      blockTitleSize: 33,
      fontFamily: FONT_FAMILY,
      fontWeight: 800,
    },
    spacing: {
      pagePadding: 60,
      blockGap: 18,
      blockPadding: 26,
    },
    radius: {
      card: 22,
      chip: 16,
    },
    shadow: {
      soft: "rgba(0,0,0,0.18)",
      medium: "rgba(0,0,0,0.28)",
    },
  };
}

/** Accept #rgb / #rrggbb / rgb()/rgba() and return rgba() with given alpha. */
export function hexToRgba(color: string, alpha: number): string {
  if (color.startsWith("rgb")) {
    const nums = color.match(/[\d.]+/g)?.slice(0, 3) ?? ["0", "0", "0"];
    return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
  }
  let hex = color.replace("#", "");
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
