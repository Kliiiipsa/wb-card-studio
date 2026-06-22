import type { CardStrategy } from "./types";
import { BASE_NEGATIVE } from "./wb-rules";

/**
 * Turn a CardStrategy into a single English image-model prompt.
 *
 * Crucially, it instructs the model to leave clean, empty typography zones and
 * NOT render any text — the real (Russian) text is composited later by the
 * canvas renderer. This avoids broken Cyrillic glyphs inside generated images.
 */
export function strategyToImagePrompt(strategy: CardStrategy): string {
  const c = strategy.composition;
  const parts = [
    `Premium Wildberries marketplace product card, ${strategy.cardType} concept`,
    strategy.visualConcept,
    c.productPlacement,
    `background: ${c.background}`,
    `lighting: ${c.lighting}`,
    c.accentElements.length ? `accents: ${c.accentElements.join(", ")}` : "",
    `color palette: ${strategy.colors.palette.join(", ")} (${strategy.colors.mood})`,
    `composition: balanced, ${c.textZones.join("; ")} kept clean and empty for text overlay`,
    "do NOT render any text, letters, words or logos inside the image",
    "high-end e-commerce catalog quality, sharp, realistic, undistorted product",
  ].filter(Boolean);
  return parts.join(". ");
}

export function buildNegativePrompt(extra?: string): string {
  const base = BASE_NEGATIVE.join(", ");
  return extra?.trim() ? `${base}, ${extra.trim()}` : base;
}
