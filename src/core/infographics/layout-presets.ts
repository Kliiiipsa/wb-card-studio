import type { InfographicType, InfographicLayout, InfographicStyle } from "./types";

/** Fixed coordinate space the overlay plan is authored in (scaled at render). */
export const PLAN_W = 900;
export const PLAN_H = 1200;

export type LayoutPreset = {
  layout: InfographicLayout;
  /** where benefit blocks go */
  blocksPlacement: "bottom" | "right" | "left";
  maxBlocks: number;
  /** short hint added to the image prompt about composition */
  compositionHint: string;
};

export const LAYOUT_BY_TYPE: Record<InfographicType, LayoutPreset> = {
  benefits: {
    layout: "clean_cover_with_benefits",
    blocksPlacement: "bottom",
    maxBlocks: 3,
    compositionHint:
      "product centered and large, clean empty band at the bottom for benefit cards, headline space at top",
  },
  why_buy: {
    layout: "product_center_blocks_around",
    blocksPlacement: "bottom",
    maxBlocks: 3,
    compositionHint:
      "product centered, calm composition, empty space at top for a headline and at bottom for arguments",
  },
  materials: {
    layout: "product_left_blocks_right",
    blocksPlacement: "right",
    maxBlocks: 4,
    compositionHint:
      "product on the left with visible material texture, clean right column for callout blocks",
  },
  sizes: {
    layout: "product_center_blocks_around",
    blocksPlacement: "bottom",
    maxBlocks: 4,
    compositionHint:
      "product or silhouette centered on a neutral background, clean lower area for a size table",
  },
  comparison: {
    layout: "product_center_blocks_around",
    blocksPlacement: "bottom",
    maxBlocks: 3,
    compositionHint: "product centered, balanced composition with clean zones",
  },
  package: {
    layout: "product_top_blocks_bottom",
    blocksPlacement: "bottom",
    maxBlocks: 4,
    compositionHint: "items neatly arranged, clean area for labels",
  },
  trust: {
    layout: "product_center_blocks_around",
    blocksPlacement: "bottom",
    maxBlocks: 3,
    compositionHint: "product centered, calm reassuring composition, clean badge area",
  },
};

export type StylePalette = {
  /** image-prompt descriptors */
  visual: string;
  background: string;
  lighting: string;
  /** canvas palette: [accent, plate, headlineText, benefitText] */
  palette: string[];
};

export const STYLE_PRESETS: Record<Exclude<InfographicStyle, "auto">, StylePalette> = {
  minimal: {
    visual: "clean minimalism, lots of negative space, editorial",
    background: "soft light neutral background, subtle gradient",
    lighting: "soft even studio light",
    palette: ["#6d28d9", "rgba(15,23,42,0.55)", "#ffffff", "#ffffff"],
  },
  premium: {
    visual: "expensive premium look, refined, high-end catalog",
    background: "deep graphite gradient background, subtle luxury texture",
    lighting: "dramatic soft studio light",
    palette: ["#b8860b", "rgba(10,12,20,0.6)", "#ffffff", "#ffffff"],
  },
  bright: {
    visual: "bold vivid commercial look, energetic",
    background: "clean bright background with a vivid accent",
    lighting: "punchy directional light",
    palette: ["#e11d48", "rgba(15,23,42,0.55)", "#ffffff", "#ffffff"],
  },
  soft: {
    visual: "soft gentle aesthetic, delicate, cozy",
    background: "soft pastel neutral background",
    lighting: "soft diffused light",
    palette: ["#db2777", "rgba(15,23,42,0.5)", "#ffffff", "#ffffff"],
  },
  dark: {
    visual: "luxury dark look, sleek, refined",
    background: "dark graphite/black background, subtle texture",
    lighting: "controlled highlights, soft studio light",
    palette: ["#3b82f6", "rgba(0,0,0,0.55)", "#ffffff", "#ffffff"],
  },
};

/** Resolve "auto" to a concrete style by category keywords (simple heuristic). */
export function resolveStyle(
  style: InfographicStyle,
  category?: string,
): Exclude<InfographicStyle, "auto"> {
  if (style !== "auto") return style;
  const c = (category ?? "").toLowerCase();
  if (/(косметик|красот|уход|парфюм|beauty)/.test(c)) return "soft";
  if (/(техник|гаджет|электрон|tech)/.test(c)) return "dark";
  if (/(спорт|детск|игрушк)/.test(c)) return "bright";
  if (/(ювелир|часы|премиум|luxury|кожа)/.test(c)) return "premium";
  return "minimal";
}
