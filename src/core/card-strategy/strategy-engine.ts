import { STYLE_MAP, type StyleId } from "@/core/domain/styles";
import { CARD_TYPE_MAP } from "@/core/domain/card-types";
import type { CardStrategy, StrategyInput } from "./types";
import { getTemplate } from "./templates";
import { WB_CHECKLIST, MAX_HEADLINE_WORDS } from "./wb-rules";
import { strategyToImagePrompt, buildNegativePrompt } from "./prompt-builder";

/**
 * Deterministic, provider-independent planner. Turns product data + card type +
 * style (+ optional prior analysis) into a structured CardStrategy. No tokens
 * required — this is the backbone the image prompt is built from.
 */
export function buildCardStrategy(input: StrategyInput): CardStrategy {
  const product = input.product ?? {};
  const name = product.name?.trim() || "товар";
  const style = STYLE_MAP[input.style as StyleId] ?? STYLE_MAP["premium-minimal"];
  const cardType = CARD_TYPE_MAP[input.cardType as keyof typeof CARD_TYPE_MAP];
  const template = getTemplate(input.cardType);

  const benefits = (product.benefits ?? []).filter(Boolean).slice(0, 5);
  const mainMessage = clampWords(benefits[0] || template.defaultMessage(name), MAX_HEADLINE_WORDS);
  const subMessage = product.audience?.trim() || product.category?.trim() || undefined;

  const palette = style.palette.split(/,\s*/).map((p) => p.trim());

  const visualConcept = [
    cardType?.promptHint ?? template.goal,
    style.visual,
    input.userPrompt?.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const strategy: CardStrategy = {
    cardType: cardType?.title ?? input.cardType,
    targetAudience: product.audience?.trim() || "целевая аудитория категории",
    mainMessage,
    subMessage,
    benefits,
    visualConcept,
    composition: {
      productPlacement: template.productPlacement,
      textZones: template.textZones,
      safeZones: ["center product area", ...template.textZones],
      background: `${style.palette} background, clean and premium`,
      lighting: style.lighting,
      accentElements: template.accentElements,
    },
    typography: {
      headlineStyle: "bold, high-contrast, easy to read on mobile",
      textDensity: benefits.length > 3 ? "medium" : "low",
      maxHeadlineWords: MAX_HEADLINE_WORDS,
    },
    colors: {
      palette,
      mood: style.title,
    },
    wbChecklist: WB_CHECKLIST,
    imagePrompt: "",
    negativePrompt: buildNegativePrompt(),
  };

  // incorporate prior analysis (if any) into the visual concept
  if (input.analysis?.mainProblem) {
    strategy.visualConcept += `. Address weakness: ${input.analysis.mainProblem}`;
  }

  strategy.imagePrompt = strategyToImagePrompt(strategy);
  return strategy;
}

function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  return words.length <= maxWords ? text.trim() : words.slice(0, maxWords).join(" ");
}
