import type { LLMMessage } from "@/core/ai/providers/types";
import type { PromptIntent, PromptResult } from "./prompt-intent";
import { styleModeGuidance } from "./prompt-intent";
import { productPromptMessages } from "./prompt-from-product";
import { imagePromptMessages } from "./prompt-from-image";
import { DEFAULT_NEGATIVE_RU } from "./constants";

/** Choose the right message builder based on whether a reference image is present. */
export function buildPromptMessages(intent: PromptIntent, imageDataUrl?: string): LLMMessage[] {
  return imageDataUrl ? imagePromptMessages(intent, imageDataUrl) : productPromptMessages(intent);
}

/** Parse the LLM JSON response into a PromptResult (lenient). */
export function parsePromptResult(raw: unknown): PromptResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const generatedPrompt = typeof o.generatedPrompt === "string" ? o.generatedPrompt.trim() : "";
  if (!generatedPrompt) return null;
  return {
    generatedPrompt,
    negativePrompt:
      typeof o.negativePrompt === "string" && o.negativePrompt.trim()
        ? o.negativePrompt.trim()
        : DEFAULT_NEGATIVE_RU,
    overlaySuggestion:
      typeof o.overlaySuggestion === "string" ? o.overlaySuggestion.trim() : undefined,
    visualDirection: typeof o.visualDirection === "string" ? o.visualDirection.trim() : "",
  };
}

/**
 * Deterministic fallback used when the LLM is unavailable or returns garbage.
 * Produces a clean Russian prompt straight from the product data.
 */
export function fallbackPrompt(intent: PromptIntent): PromptResult {
  const name = intent.productName?.trim() || "товар";
  const benefit = intent.benefits?.[0]?.trim();
  const headline = benefit || name;
  const parts = [
    `Премиальная карточка для Wildberries: ${name} крупным планом, в центре и в фокусе`,
    `чистый фон, ${styleModeGuidance(intent.styleMode)}`,
    "мягкий студийный свет, аккуратная композиция",
    "слева оставить чистую пустую зону под заголовок, без текста на изображении",
    intent.userNote?.trim() ? `пожелание: ${intent.userNote.trim()}` : "",
  ].filter(Boolean);

  return {
    generatedPrompt: parts.join(", ") + ".",
    negativePrompt: DEFAULT_NEGATIVE_RU,
    overlaySuggestion: headline.split(/\s+/).slice(0, 5).join(" "),
    visualDirection: styleModeGuidance(intent.styleMode),
  };
}
