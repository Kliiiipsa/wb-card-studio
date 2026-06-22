import "server-only";
import { getLLMProvider, getImageProvider } from "@/core/ai/providers";
import { uid } from "@/lib/utils";
import type {
  InfographicInput,
  InfographicBrief,
  AutofillResult,
  InfographicBlock,
  StyleProfile,
} from "./types";
import { LAYOUT_BY_TYPE } from "./layout-presets";
import { assembleBrief, buildInfographicBriefFallback, type BriefCopy } from "./brief-builder";
import { DEFAULT_STYLE_PROFILE } from "./style-library";

/* ----------------------------- helpers ----------------------------- */

function safeJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = /\{[\s\S]*\}/.exec(cleaned);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function ensureDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;
  const res = await fetch(src, { cache: "no-store" });
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/* ----------------------------- autofill ----------------------------- */

export async function autofillFromImage(args: {
  imageDataUrl: string;
  productName?: string;
  category?: string;
}): Promise<AutofillResult> {
  try {
    const image = await ensureDataUrl(args.imageDataUrl);
    const llm = getLLMProvider();
    const result = await llm.complete({
      task: "analyze",
      json: true,
      vision: true,
      messages: [
        {
          role: "system",
          content:
            "Ты — товаровед маркетплейса. По фото определи товар и предложи данные для карточки. Отвечай строго JSON на русском.",
        },
        {
          role: "user",
          content: `Посмотри на фото товара${args.productName ? ` (подсказка: ${args.productName})` : ""}. Верни JSON:
{
  "detectedProduct": "что за товар, коротко",
  "suggestedCategory": "категория",
  "suggestedBenefits": ["3-5 коротких преимуществ"],
  "suggestedPainPoints": ["2-3 боли клиента, которые закрывает товар"],
  "warnings": ["если что-то непонятно по фото"]
}
Преимущества короткие (2-4 слова). Не выдумывай состав, гарантию, бренд.`,
          imageDataUrl: image,
        },
      ],
    });
    const data = safeJson(result.text) as Partial<AutofillResult> | null;
    if (!data) throw new Error("no json");
    return {
      detectedProduct: data.detectedProduct ?? args.productName ?? "",
      suggestedCategory: data.suggestedCategory ?? args.category ?? "",
      suggestedBenefits: Array.isArray(data.suggestedBenefits)
        ? data.suggestedBenefits.slice(0, 5)
        : [],
      suggestedPainPoints: Array.isArray(data.suggestedPainPoints)
        ? data.suggestedPainPoints.slice(0, 3)
        : [],
      warnings: Array.isArray(data.warnings) ? data.warnings : [],
    };
  } catch {
    return {
      detectedProduct: args.productName ?? "",
      suggestedCategory: args.category ?? "",
      suggestedBenefits: [],
      suggestedPainPoints: [],
      warnings: ["Не удалось распознать фото — заполните данные вручную."],
    };
  }
}

/* ------------------------------ brief ------------------------------ */

export async function buildInfographicBrief(
  input: InfographicInput,
  styleProfile?: StyleProfile,
): Promise<InfographicBrief> {
  try {
    const max = LAYOUT_BY_TYPE[input.type].maxBlocks;
    const llm = getLLMProvider();
    const result = await llm.complete({
      task: "write-prompt",
      json: true,
      context: { intent: { productName: input.productName } },
      messages: [
        {
          role: "system",
          content: `Ты — дизайнер карточек Wildberries. Пишешь КОРОТКИЙ продающий текст для инфографики.
Правила: заголовок до 5-7 слов; каждый блок-преимущество до 3-5 слов; без канцелярита и длинных фраз;
не выдумывай состав, гарантию, сертификаты, страну. Используй только данные пользователя. Ответ строго JSON на русском.`,
        },
        {
          role: "user",
          content: `Товар: ${input.productName}
Категория: ${input.category ?? "-"}
Аудитория: ${input.targetAudience ?? "-"}
Преимущества: ${(input.benefits ?? []).join(", ") || "-"}
Боли клиента: ${(input.painPoints ?? []).join(", ") || "-"}
Тип инфографики: ${input.type}
Пожелание: ${input.userNote ?? "-"}

Верни JSON:
{
  "headline": "заголовок до 5-7 слов",
  "subheadline": "короткий подзаголовок или пусто",
  "blocks": [ { "title": "преимущество 3-5 слов" } ]  // максимум ${max}
}`,
        },
      ],
    });
    const data = safeJson(result.text) as {
      headline?: string;
      subheadline?: string;
      blocks?: { title?: string }[];
    } | null;
    if (!data?.headline) throw new Error("no copy");

    const blocks: InfographicBlock[] = (data.blocks ?? [])
      .map((b) => b.title?.trim())
      .filter((t): t is string => !!t)
      .slice(0, max)
      .map((title) => ({ id: uid("blk"), title, priority: "primary" as const }));

    const copy: BriefCopy = {
      headline: data.headline.trim(),
      subheadline: data.subheadline?.trim() || undefined,
      blocks: blocks.length ? blocks : buildInfographicBriefFallback(input).blocks,
    };
    return assembleBrief(input, copy, styleProfile);
  } catch {
    return buildInfographicBriefFallback(input, styleProfile);
  }
}

/* --------------------------- style extraction --------------------------- */

/** Analyze a reference infographic and extract ONLY its visual style. */
export async function extractStyleProfile(referenceImageDataUrl: string): Promise<StyleProfile> {
  try {
    const image = await ensureDataUrl(referenceImageDataUrl);
    const llm = getLLMProvider();
    const result = await llm.complete({
      task: "analyze",
      json: true,
      vision: true,
      messages: [
        {
          role: "system",
          content:
            "Ты — арт-директор. Извлеки ТОЛЬКО визуальный стиль референс-инфографики (не товар, не текст, не логотип). Ответ строго JSON.",
        },
        {
          role: "user",
          content: `Опиши стиль этой инфографики для переноса на другой товар. Верни JSON:
{
  "name": "короткое имя стиля на русском",
  "mode": "light | dark (яркость фона)",
  "palette": { "background": "#hex", "surface": "rgba/#hex", "textPrimary": "#hex", "textSecondary": "#hex", "accent": "#hex" },
  "cardStyle": "integrated-soft | premium-editorial | marketplace-clean",
  "density": "low | medium | high",
  "radius": число (скругление карточек, 0-40),
  "headlinePosition": "top | bottom",
  "visualLanguage": "english descriptors of the look",
  "background": "english background description",
  "lighting": "english lighting description",
  "accentElements": ["english short list"]
}
Только стиль, без копирования товара/текста/логотипа.`,
          imageDataUrl: image,
        },
      ],
    });
    const d = safeJson(result.text) as Partial<StyleProfile> | null;
    if (!d?.palette) throw new Error("no style");
    return {
      id: uid("style"),
      name: typeof d.name === "string" ? d.name : "Свой референс",
      source: "reference",
      visualLanguage: d.visualLanguage ?? DEFAULT_STYLE_PROFILE.visualLanguage,
      background: d.background ?? DEFAULT_STYLE_PROFILE.background,
      lighting: d.lighting ?? DEFAULT_STYLE_PROFILE.lighting,
      mode: d.mode === "dark" ? "dark" : "light",
      palette: {
        background: d.palette.background ?? DEFAULT_STYLE_PROFILE.palette.background,
        surface: d.palette.surface ?? DEFAULT_STYLE_PROFILE.palette.surface,
        textPrimary: d.palette.textPrimary ?? DEFAULT_STYLE_PROFILE.palette.textPrimary,
        textSecondary: d.palette.textSecondary ?? DEFAULT_STYLE_PROFILE.palette.textSecondary,
        accent: d.palette.accent ?? DEFAULT_STYLE_PROFILE.palette.accent,
      },
      cardStyle:
        d.cardStyle === "premium-editorial" || d.cardStyle === "integrated-soft"
          ? d.cardStyle
          : "marketplace-clean",
      density: d.density === "low" || d.density === "high" ? d.density : "medium",
      radius: typeof d.radius === "number" ? Math.max(0, Math.min(40, d.radius)) : 20,
      headlinePosition: d.headlinePosition === "bottom" ? "bottom" : "top",
      accentElements: Array.isArray(d.accentElements) ? d.accentElements.slice(0, 4) : [],
    };
  } catch {
    return {
      ...DEFAULT_STYLE_PROFILE,
      id: uid("style"),
      source: "reference",
      name: "Свой референс",
    };
  }
}

/* ---------------------------- generate ----------------------------- */

export async function generateInfographicBase(args: {
  brief: InfographicBrief;
  referenceImage?: string;
  aspectRatio?: "3:4" | "4:5";
}): Promise<string> {
  const image = getImageProvider();
  const aspectRatio = args.aspectRatio ?? "3:4";
  const res = args.referenceImage
    ? await image.imageToImage({
        prompt: args.brief.imagePrompt,
        negativePrompt: args.brief.negativePrompt,
        referenceImageDataUrl: args.referenceImage,
        strength: 0.4,
        aspectRatio,
        count: 1,
      })
    : await image.textToImage({
        prompt: args.brief.imagePrompt,
        negativePrompt: args.brief.negativePrompt,
        aspectRatio,
        count: 1,
      });
  return res.images[0].url;
}
