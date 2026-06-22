import type { InfographicInput, InfographicStyle, StyleProfile } from "./types";
import { STYLE_PRESETS, LAYOUT_BY_TYPE, resolveStyle } from "./layout-presets";

const NEGATIVE =
  "text, letters, words, typography, logo, watermark, badge, label, icon, infographic, " +
  "misspelled text, fake brand, distorted product, changed color, changed shape, extra objects, " +
  "low quality, blurry";

/**
 * Build the English image prompt for a CLEAN visual base. The model must not
 * render any text/logos/badges/infographic — those are added on the canvas.
 *
 * When a `styleProfile` is provided (reference-based generation), its visual
 * language / background / lighting drive the look — but the PRODUCT stays the
 * user's, and no reference text/logo is reproduced.
 */
export function buildInfographicImagePrompt(
  input: InfographicInput,
  resolvedStyle: Exclude<InfographicStyle, "auto">,
  styleProfile?: StyleProfile,
): { imagePrompt: string; negativePrompt: string; backgroundPrompt: string } {
  const sp = STYLE_PRESETS[resolvedStyle];
  const layout = LAYOUT_BY_TYPE[input.type];
  const hasRef = !!input.referenceImage;

  const visual = styleProfile?.visualLanguage ?? sp.visual;
  const background = styleProfile?.background ?? sp.background;
  const lighting = styleProfile?.lighting ?? sp.lighting;

  const base = hasRef
    ? "Create a clean premium marketplace product visual of the USER'S product based on the reference product photo. " +
      "Keep the user's product shape, color, material and proportions unchanged."
    : "Create a clean premium marketplace product visual of the described product.";

  const imagePrompt = [
    base,
    styleProfile ? `Apply this visual STYLE only (not another product): ${visual}` : visual,
    background,
    `lighting: ${lighting}`,
    `composition: ${layout.compositionHint}`,
    "leave generous empty space for future text overlay",
    "Do not render any text, letters, logos, badges, icons, labels or infographic elements.",
    "Do not copy any product, text or logo from the reference — only its style.",
    "marketplace product photography, high quality, sharp, realistic, undistorted product",
  ].join(". ");

  return { imagePrompt, negativePrompt: NEGATIVE, backgroundPrompt: background };
}

export { resolveStyle };
