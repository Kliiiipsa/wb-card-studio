import { uid } from "@/lib/utils";
import type {
  InfographicInput,
  InfographicBrief,
  InfographicBlock,
  InfographicStyle,
  StyleProfile,
} from "./types";
import { LAYOUT_BY_TYPE, STYLE_PRESETS, resolveStyle } from "./layout-presets";
import { buildInfographicImagePrompt } from "./infographic-prompt-builder";
import { buildOverlayPlan } from "./overlay-builder";

export type BriefCopy = {
  headline: string;
  subheadline?: string;
  blocks: InfographicBlock[];
};

function clampWords(text: string, max: number): string {
  const w = text.trim().split(/\s+/);
  return w.length <= max ? text.trim() : w.slice(0, max).join(" ");
}

/** Deterministic copywriting straight from the user's data (no AI). */
export function deterministicCopy(input: InfographicInput): BriefCopy {
  const name = input.productName?.trim() || "Товар";
  const benefits = (input.benefits ?? []).map((b) => b.trim()).filter(Boolean);
  const max = LAYOUT_BY_TYPE[input.type].maxBlocks;

  const headlineByType: Record<string, string> = {
    benefits: benefits[0] ? clampWords(benefits[0], 6) : name,
    why_buy: `Почему стоит выбрать`,
    materials: `Качество в деталях`,
    sizes: `Подберите свой размер`,
  };
  const headline = clampWords(headlineByType[input.type] ?? name, 7);
  const subheadline = input.category?.trim() || input.targetAudience?.trim() || undefined;

  const blocks: InfographicBlock[] = benefits.slice(0, max).map((b) => ({
    id: uid("blk"),
    title: clampWords(b, 5),
    priority: "primary" as const,
  }));

  return { headline, subheadline, blocks };
}

/** Assemble a full brief from input + copy (used by both LLM and fallback paths). */
export function assembleBrief(
  input: InfographicInput,
  copy: BriefCopy,
  styleProfile?: StyleProfile,
): InfographicBrief {
  const resolvedStyle: Exclude<InfographicStyle, "auto"> = resolveStyle(
    input.style,
    input.category,
  );
  const preset = LAYOUT_BY_TYPE[input.type];
  const sp = STYLE_PRESETS[resolvedStyle];
  const { imagePrompt, negativePrompt, backgroundPrompt } = buildInfographicImagePrompt(
    input,
    resolvedStyle,
    styleProfile,
    { headline: copy.headline, subheadline: copy.subheadline, blocks: copy.blocks },
  );

  const warnings: string[] = [];
  if (copy.blocks.length === 0) {
    warnings.push("Не указаны преимущества — добавьте их, чтобы заполнить блоки карточки.");
  }
  if (input.type === "sizes") {
    warnings.push("Для размерной сетки добавьте размеры в блоки — таблица соберётся на canvas.");
  }

  // density (from style) caps how many blocks we show
  const densityCap = styleProfile
    ? styleProfile.density === "low"
      ? 3
      : styleProfile.density === "high"
        ? 5
        : 4
    : preset.maxBlocks;
  const blocks = copy.blocks.slice(0, densityCap);

  const palette = styleProfile
    ? [styleProfile.palette.accent, styleProfile.palette.surface, styleProfile.palette.textPrimary]
    : sp.palette;

  const overlayPlan = buildOverlayPlan({
    headline: copy.headline,
    subheadline: copy.subheadline,
    blocks,
    palette,
    preset,
  });

  return {
    id: uid("brief"),
    type: input.type,
    style: resolvedStyle,
    headline: copy.headline,
    subheadline: copy.subheadline,
    blocks,
    layout: preset.layout,
    palette,
    backgroundPrompt,
    imagePrompt,
    negativePrompt,
    overlayPlan,
    styleProfile,
    warnings,
  };
}

/** Full deterministic brief (no AI) — used as a fallback. */
export function buildInfographicBriefFallback(
  input: InfographicInput,
  styleProfile?: StyleProfile,
): InfographicBrief {
  return assembleBrief(input, deterministicCopy(input), styleProfile);
}

/** Rebuild the overlay plan after the user edits headline/blocks in the UI. */
export function rebuildBrief(
  input: InfographicInput,
  copy: BriefCopy,
  styleProfile?: StyleProfile,
): InfographicBrief {
  return assembleBrief(input, copy, styleProfile);
}
