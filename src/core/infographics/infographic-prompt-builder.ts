import type { InfographicInput, InfographicStyle, StyleProfile } from "./types";
import { STYLE_PRESETS, LAYOUT_BY_TYPE, resolveStyle } from "./layout-presets";

/** Only quality/integrity negatives — we WANT the model to render text now. */
const NEGATIVE =
  "misspelled text, distorted product, changed product, low quality, blurry, watermark, " +
  "fake brand logo, extra random objects";

export type PromptCopy = {
  headline: string;
  subheadline?: string;
  blocks: { title: string }[];
};

/**
 * Build the image prompt for a COMPLETE marketplace infographic — the model
 * renders the whole card (product + title + benefit badges + size/material
 * chips) with the Russian text baked in, styled after the reference.
 *
 * When `styleProfile` is present (reference-based), the look (palette,
 * typography feel, layout rhythm) follows the reference; the PRODUCT stays the
 * user's, and no reference text/logo is copied verbatim.
 */
export function buildInfographicImagePrompt(
  input: InfographicInput,
  resolvedStyle: Exclude<InfographicStyle, "auto">,
  styleProfile?: StyleProfile,
  copy?: PromptCopy,
): { imagePrompt: string; negativePrompt: string; backgroundPrompt: string } {
  const sp = STYLE_PRESETS[resolvedStyle];
  const layout = LAYOUT_BY_TYPE[input.type];
  const hasRef = !!input.referenceImage;

  const visual = styleProfile?.visualLanguage ?? sp.visual;
  const background = styleProfile?.background ?? sp.background;
  const lighting = styleProfile?.lighting ?? sp.lighting;

  const headline = (copy?.headline || input.productName || "Товар").trim();
  const benefits = (copy?.blocks?.map((b) => b.title) ?? input.benefits ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);

  const parts = [
    "Render a complete, ready-to-publish Wildberries marketplace product infographic card.",
    hasRef
      ? "Use the user's product from the reference photo; keep its shape, color, material and proportions; adapt the infographic STYLE to this product, do not copy the reference product or its text."
      : "Show the described product as the hero of the card.",
    `Bake the following Russian (Cyrillic) text directly into the image, spelled exactly, clean and legible:`,
    `large title at the top: "${headline}".`,
    benefits.length
      ? `benefit captions, each with a small matching icon or rounded badge: ${benefits
          .map((b) => `"${b}"`)
          .join(", ")}.`
      : "",
    input.type === "sizes" ? "include tidy size chips (S, M, L, XL) if relevant." : "",
    input.type === "materials" ? "include small material/composition chips if relevant." : "",
    styleProfile ? `match this reference visual style: ${visual}.` : `visual style: ${visual}.`,
    `background: ${background}; lighting: ${lighting}.`,
    `composition: ${layout.compositionHint}; consistent typography, rounded badges, soft shadows, balanced grid, generous spacing.`,
    "Premium marketplace design that looks like one cohesive card, high quality, sharp. The Cyrillic text must be correct and perfectly readable.",
  ].filter(Boolean);

  return {
    imagePrompt: parts.join(" "),
    negativePrompt: NEGATIVE,
    backgroundPrompt: background,
  };
}

export { resolveStyle };
