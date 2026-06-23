import "server-only";
import { getLLMProvider, getInfographicImageProvider, getImageProvider } from "@/core/ai/providers";
import type { ImageProvider } from "@/core/ai/providers/types";
import { uid } from "@/lib/utils";
import type {
  InfographicInput,
  InfographicBrief,
  AutofillResult,
  InfographicBlock,
  StyleProfile,
} from "./types";
import { LAYOUT_BY_TYPE } from "./layout-presets";
import { buildBakedCardPrompt } from "./infographic-prompt-builder";
import { assembleBrief, buildInfographicBriefFallback, type BriefCopy } from "./brief-builder";
import { DEFAULT_STYLE_PROFILE } from "./style-library";
import { layoutPlanSchema } from "./schemas";
import { fallbackLayoutPlan, sanitizeLayoutPlan, type LayoutPlan } from "./layout-plan";

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

/* --------------------------- layout analysis --------------------------- */

/**
 * Vision pass: look at the product photo and plan WHERE the product sits and
 * WHERE text/benefits should go, in normalized coordinates. Geometry only — the
 * model never returns Russian copy (that's matched back by index), so it can't
 * mangle Cyrillic. Any failure falls back to a deterministic plan.
 */
export async function analyzeLayout(args: {
  productImageDataUrl: string;
  benefitCount: number;
  type: InfographicInput["type"];
  headlinePosition?: "top" | "bottom";
  mode?: "light" | "dark";
  hasSubheadline: boolean;
}): Promise<LayoutPlan> {
  const params = {
    benefitCount: args.benefitCount,
    hasSubheadline: args.hasSubheadline,
    headlinePosition: args.headlinePosition,
    mode: args.mode,
  };
  try {
    const image = await ensureDataUrl(args.productImageDataUrl);
    const llm = getLLMProvider();
    const result = await llm.complete({
      task: "analyze",
      json: true,
      vision: true,
      messages: [
        {
          role: "system",
          content:
            "Ты — арт-директор инфографики для маркетплейса. По фото товара ты планируешь " +
            "РАСКЛАДКУ (геометрию), но НЕ пишешь текст. Координаты — доли 0..1 (x,y — левый " +
            "верхний угол; 0 слева/сверху, 1 справа/снизу). Отвечай СТРОГО валидным JSON по " +
            "схеме, без markdown и комментариев.",
        },
        {
          role: "user",
          content: `Фото товара во вложении. Нужно разместить заголовок (1), при уместности подзаголовок, и ${args.benefitCount} плашек-преимуществ (верни их index 0..${Math.max(0, args.benefitCount - 1)}).

Правила:
1) Определи bounding box товара/модели (product) и НЕ перекрывай его текстом.
2) Найди реально свободные зоны (freeZones) — там, где фон, а не товар.
3) headline и benefits размещай ТОЛЬКО в свободных зонах; они не пересекаются между собой и с product.
4) mode = "light", если фон под текстом светлый (рендер сделает тёмные буквы); mode = "dark", если фон тёмный (светлые буквы).
5) plate=true для блока, если под ним неоднородный/контрастный фон.
6) Если товар смещён влево — текст справа, и наоборот. НЕ повторяй один и тот же шаблон.
7) fontScale (доля высоты): заголовок 0.05–0.09, преимущества 0.02–0.035.
8) Соблюдай safeMargins (~4% от краёв).
9) callouts добавляй только если видны конкретные детали для выноски (воротник, ткань, фурнитура): anchor — точка на детали, label — место подписи.

Верни JSON: { version:1, mode, product:{x,y,w,h}, freeZones:[{x,y,w,h}], safeMargins:{top,bottom,left,right}, headline:{box:{x,y,w,h},align,fontScale,maxLines,plate,side}, subheadline?, benefits:[{index,box,align,fontScale,plate,icon}], callouts:[], notes? }`,
          imageDataUrl: image,
        },
      ],
    });
    const parsed = layoutPlanSchema.safeParse(safeJson(result.text));
    if (!parsed.success) throw new Error("invalid layout plan");
    return sanitizeLayoutPlan(parsed.data as LayoutPlan, params);
  } catch {
    return fallbackLayoutPlan(params);
  }
}

/* ------------------------------ brief ------------------------------ */

export async function buildInfographicBrief(
  input: InfographicInput,
  styleProfile?: StyleProfile,
): Promise<InfographicBrief> {
  // plan the per-photo layout in parallel with copywriting when a photo exists
  const blocksForCount = Math.min(
    (input.benefits ?? []).filter((b) => b.trim()).length || LAYOUT_BY_TYPE[input.type].maxBlocks,
    styleProfile?.density === "low" ? 3 : styleProfile?.density === "high" ? 5 : 4,
  );
  const layoutPromise: Promise<LayoutPlan | undefined> = input.referenceImage
    ? analyzeLayout({
        productImageDataUrl: input.referenceImage,
        benefitCount: blocksForCount,
        type: input.type,
        headlinePosition: styleProfile?.headlinePosition,
        mode: styleProfile?.mode,
        hasSubheadline: !!(input.category || input.targetAudience),
      })
    : Promise.resolve(undefined);

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
    const layoutPlan = await layoutPromise;
    return assembleBrief(input, copy, styleProfile, layoutPlan);
  } catch {
    const layoutPlan = await layoutPromise.catch(() => undefined);
    return buildInfographicBriefFallback(input, styleProfile, layoutPlan);
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

/** Providers that render Cyrillic text natively — we let them bake the text in. */
function canBakeText(providerId: string): boolean {
  return providerId === "fal-gpt-image" || providerId === "openai";
}

export async function generateInfographicBase(args: {
  brief: InfographicBrief;
  /** the user's product photo */
  productImage?: string;
  /** the STYLE reference image (e.g. competitor card) — drives the look */
  styleReferenceImage?: string;
  productName?: string;
  aspectRatio?: "3:4" | "4:5";
}): Promise<{ baseImageUrl: string; textBaked: boolean }> {
  const aspectRatio = args.aspectRatio ?? "3:4";
  const product = args.productName?.trim() || "the user's product";

  const bakedPrompt = () =>
    buildBakedCardPrompt({
      productName: product,
      headline: args.brief.headline,
      subheadline: args.brief.subheadline,
      benefits: args.brief.blocks.map((b) => b.title).filter(Boolean),
      styleProfile: args.brief.styleProfile,
      hasProductImage: !!args.productImage || !!args.styleReferenceImage,
    });

  // When `bake` is true the model renders the Russian text itself (gpt-image),
  // so the typography is part of the image. When false it produces a clean,
  // text-free base and the canvas overlay adds the text (Flux path).
  const run = async (image: ImageProvider, bake: boolean): Promise<string> => {
    // Custom style reference + product photo: give the model BOTH images — the
    // product MUST come from the user's photo, the reference supplies STYLE only
    // (gpt-image-2 takes multiple images; single-image models use just the product).
    if (args.styleReferenceImage && args.productImage) {
      const twoImageNote = bake
        ? ` Two images are provided. The FIRST image is the user's product — keep THAT exact product (same garment, colors, materials, person/identity). The SECOND image is a STYLE REFERENCE ONLY: copy its composition, layout rhythm, palette, typography and decorative language, but DO NOT reuse its product, its model, its photo or its text.`
        : ` The product is the FIRST image — keep it unchanged. Use the SECOND image only as a STYLE reference (palette, composition, rhythm); do not copy its product or text. Remove any text/logo, leave empty space for a future text overlay.`;
      const res = await image.imageToImage({
        prompt: (bake ? bakedPrompt() : args.brief.imagePrompt) + twoImageNote,
        negativePrompt: bake ? undefined : args.brief.negativePrompt,
        referenceImageDataUrl: args.productImage,
        extraImageUrls: [args.styleReferenceImage],
        strength: 0.5,
        aspectRatio,
        count: 1,
      });
      return res.images[0].url;
    }

    // Style reference but NO product photo: restyle the reference itself.
    if (args.styleReferenceImage) {
      const styleNote =
        ` The provided image is a STYLE REFERENCE: reproduce its visual style — layout rhythm,` +
        ` palette, background, lighting and composition — but the product MUST be ${product}, not` +
        ` the reference's. Replace the reference product with ${product}.`;
      const prompt = bake
        ? bakedPrompt() + styleNote
        : `${args.brief.imagePrompt}${styleNote} Remove any text, captions or logo from the reference. Clean base only, leave empty space for a future text overlay.`;
      const res = await image.imageToImage({
        prompt,
        negativePrompt: bake ? undefined : args.brief.negativePrompt,
        referenceImageDataUrl: args.styleReferenceImage,
        strength: 0.72,
        aspectRatio,
        count: 1,
      });
      return res.images[0].url;
    }

    if (args.productImage) {
      const res = await image.imageToImage({
        prompt: bake ? bakedPrompt() : args.brief.imagePrompt,
        negativePrompt: bake ? undefined : args.brief.negativePrompt,
        referenceImageDataUrl: args.productImage,
        strength: 0.5,
        aspectRatio,
        count: 1,
      });
      return res.images[0].url;
    }

    const res = await image.textToImage({
      prompt: bake ? bakedPrompt() : args.brief.imagePrompt,
      negativePrompt: bake ? undefined : args.brief.negativePrompt,
      aspectRatio,
      count: 1,
    });
    return res.images[0].url;
  };

  // The infographic provider (e.g. gpt-image) can hard-fail on some photos —
  // most notably OpenAI's content moderation rejecting fashion/skin shots. When
  // it differs from the default image provider, fall back to it (Flux) so the
  // user always gets a base instead of a dead end. The fallback can't render
  // Cyrillic, so it produces a clean base and the canvas overlay takes over.
  const primary = getInfographicImageProvider();
  const primaryBakes = canBakeText(primary.id);
  try {
    const baseImageUrl = await run(primary, primaryBakes);
    return { baseImageUrl, textBaked: primaryBakes };
  } catch (err) {
    const fallback = getImageProvider();
    if (fallback.id === primary.id) throw err;
    // eslint-disable-next-line no-console
    console.warn(
      `[infographic] base provider "${primary.id}" failed (${
        err instanceof Error ? err.message : String(err)
      }); falling back to "${fallback.id}".`,
    );
    const fallbackBakes = canBakeText(fallback.id);
    const baseImageUrl = await run(fallback, fallbackBakes);
    return { baseImageUrl, textBaked: fallbackBakes };
  }
}
