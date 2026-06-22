import type { StructuredImagePrompt } from "@/core/domain/types";
import type { z } from "zod";
import type { structuredPromptSchema } from "./schemas";

type StructuredFields = z.infer<typeof structuredPromptSchema>;

/** Flatten the structured prompt into a single string for the image model. */
export function renderStructuredPrompt(p: StructuredFields): string {
  const lines = [
    `Product: ${p.product}`,
    `Marketplace: ${p.marketplace}`,
    `Card type: ${p.cardType}`,
    `Target audience: ${p.targetAudience}`,
    `Main benefit: ${p.mainBenefit}`,
    `Visual style: ${p.visualStyle}`,
    `Composition: ${p.composition}`,
    `Background: ${p.background}`,
    `Lighting: ${p.lighting}`,
    `Typography area: ${p.typographyArea}`,
    `Color palette: ${p.colorPalette}`,
    `Premium details: ${p.premiumDetails}`,
    `Restrictions: ${p.restrictions}`,
  ];
  return lines.join("\n");
}

export function toStructuredImagePrompt(p: StructuredFields): StructuredImagePrompt {
  return { ...p, rendered: renderStructuredPrompt(p) };
}
