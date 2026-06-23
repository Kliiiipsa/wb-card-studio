import type { InfographicInput, InfographicStyle, StyleProfile } from "./types";
import { STYLE_PRESETS, LAYOUT_BY_TYPE, resolveStyle } from "./layout-presets";
import { placementOf, type LayoutPlan, type NormBox } from "./layout-plan";

/** Describe the planned product side + clean text zones, in plain words for Flux. */
function describeZones(plan: LayoutPlan): string {
  const pct = (n: number) => Math.round(n * 100);
  const zone = (z: NormBox) => `x ${pct(z.x)}–${pct(z.x + z.w)}%, y ${pct(z.y)}–${pct(z.y + z.h)}%`;
  const product = `keep the product in the ${placementOf(plan.product)} area (${zone(plan.product)})`;
  const clean = plan.freeZones.length
    ? `keep these regions clean and empty for later text overlay: ${plan.freeZones
        .map(zone)
        .join("; ")}`
    : "leave generous empty space for future text overlay";
  return `${product}; ${clean}`;
}

/**
 * Image models cannot render Cyrillic reliably (they produce gibberish
 * pseudo-text), so the model generates ONLY a clean visual base — no text,
 * logos, badges or icons. The real text (title, benefits, callouts) is added
 * afterwards as a proper-font canvas overlay.
 */
const NEGATIVE =
  "text, letters, words, typography, logo, watermark, badge, label, icon, infographic, " +
  "misspelled text, distorted product, changed color, changed shape, extra objects, " +
  "low quality, blurry";

/**
 * Build the English image prompt for a CLEAN visual base. When a `styleProfile`
 * is provided (reference-based), its visual language / background / lighting
 * drive the look — but the PRODUCT stays the user's, and NO text/logo from the
 * reference is reproduced. Empty space is reserved for the text overlay.
 */
export function buildInfographicImagePrompt(
  input: InfographicInput,
  resolvedStyle: Exclude<InfographicStyle, "auto">,
  styleProfile?: StyleProfile,
  layoutPlan?: LayoutPlan,
): { imagePrompt: string; negativePrompt: string; backgroundPrompt: string } {
  const sp = STYLE_PRESETS[resolvedStyle];
  const layout = LAYOUT_BY_TYPE[input.type];
  const hasRef = !!input.referenceImage;

  // Composition comes from the per-photo layout plan when available, so Flux
  // leaves space exactly where the renderer will place text — instead of a
  // single static hint that produced the same look for every product.
  const composition = layoutPlan ? describeZones(layoutPlan) : layout.compositionHint;

  const visual = styleProfile?.visualLanguage ?? sp.visual;
  const background = styleProfile?.background ?? sp.background;
  const lighting = styleProfile?.lighting ?? sp.lighting;

  const base = hasRef
    ? "Create a clean premium marketplace product visual of the USER'S product based on the reference product photo. " +
      "Keep the user's product shape, color, material and proportions unchanged."
    : "Create a clean premium marketplace product visual of the described product.";

  // rich, explicit style signal so the base matches the reference look
  const styleDetails = styleProfile
    ? [
        `palette: ${Object.values(styleProfile.palette).join(", ")}`,
        `mood: ${styleProfile.mode} background`,
        styleProfile.accentElements.length
          ? `accent elements: ${styleProfile.accentElements.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("; ")
    : "";

  const imagePrompt = [
    base,
    styleProfile ? `Apply this visual STYLE only (not another product): ${visual}` : visual,
    background,
    `lighting: ${lighting}`,
    styleDetails ? `style details — ${styleDetails}` : "",
    `composition: ${composition}`,
    "leave generous empty space for future text overlay",
    "Do not render any text, letters, numbers, logos, badges, icons, labels, callouts or infographic elements.",
    "Do not copy any product, text or logo from the reference — only its style.",
    "marketplace product photography, high quality, sharp, realistic, undistorted product",
  ]
    .filter(Boolean)
    .join(". ");

  return { imagePrompt, negativePrompt: NEGATIVE, backgroundPrompt: background };
}

/**
 * Prompt for a FINISHED card with the Russian text BAKED IN by the model
 * (gpt-image renders Cyrillic natively). Used instead of the clean-base prompt
 * when the image provider can render text, so the typography is part of the
 * composition — not a flat canvas overlay. No canvas text is drawn afterwards.
 */
export function buildBakedCardPrompt(args: {
  productName: string;
  headline: string;
  subheadline?: string;
  benefits: string[];
  styleProfile?: StyleProfile;
  hasProductImage: boolean;
}): string {
  const { productName, headline, subheadline, benefits, styleProfile, hasProductImage } = args;
  const product = productName.trim() || "the product";

  const styleBits = styleProfile
    ? `${styleProfile.visualLanguage}; background: ${styleProfile.background}; lighting: ${styleProfile.lighting}; palette: ${Object.values(
        styleProfile.palette,
      ).join(", ")}`
    : "clean premium marketplace look, tidy product-first composition";

  const base = hasProductImage
    ? `Using the provided product photo, create a FINISHED Wildberries marketplace infographic card for ${product}. Keep the product/person photorealistic — same identity, clothing, materials, colors and proportions.`
    : `Create a FINISHED Wildberries marketplace infographic card for ${product}.`;

  const benefitsList = benefits
    .map((b) => `«${b.trim()}»`)
    .filter((b) => b.length > 2)
    .join(", ");

  return [
    base,
    "Portrait 3:4 composition, product as the hero with tasteful clean space for text.",
    `Visual style: ${styleBits}.`,
    "Render the following RUSSIAN text directly inside the image as polished, modern marketplace typography — integrated into the layout, NOT as flat stickers, plastic pills or pasted badges:",
    `• Headline (large, bold): «${headline.trim()}»`,
    subheadline ? `• Subheadline (smaller, lighter): «${subheadline.trim()}»` : "",
    benefitsList
      ? `• ${benefits.length} short benefit captions, each with a small minimalist line icon: ${benefitsList}`
      : "",
    "Typography rules: correct Russian spelling is MANDATORY — no gibberish, no invented or duplicated words, high legibility, elegant visual hierarchy and consistent alignment.",
    "Do not cover the face or key product details with text. No watermark, no fake brand logos, no Wildberries logo.",
    "The result must look like a high-end, cohesive marketplace card — text feels designed into the scene, not pasted on top.",
  ]
    .filter(Boolean)
    .join(" ");
}

export { resolveStyle };
