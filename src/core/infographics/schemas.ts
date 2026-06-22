import { z } from "zod";

export const autofillSchema = z.object({
  imageDataUrl: z.string().min(1),
  productName: z.string().max(200).optional(),
  category: z.string().max(120).optional(),
});

export const infographicInputSchema = z.object({
  productName: z.string().min(1, "Укажите название товара").max(200),
  category: z.string().max(120).optional(),
  targetAudience: z.string().max(300).optional(),
  benefits: z.array(z.string().max(200)).max(12).default([]),
  painPoints: z.array(z.string().max(200)).max(12).optional(),
  userNote: z.string().max(1000).optional(),
  referenceImage: z.string().optional(),
  type: z
    .enum(["benefits", "materials", "sizes", "why_buy", "comparison", "package", "trust"])
    .default("benefits"),
  style: z.enum(["auto", "minimal", "premium", "bright", "soft", "dark"]).default("auto"),
  marketplace: z.literal("wildberries").default("wildberries"),
  aspectRatio: z.enum(["3:4", "4:5"]).default("3:4"),
});

export const styleProfileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    source: z.enum(["library", "reference"]),
    visualLanguage: z.string(),
    background: z.string(),
    lighting: z.string(),
    mode: z.enum(["light", "dark"]),
    palette: z.object({
      background: z.string(),
      surface: z.string(),
      textPrimary: z.string(),
      textSecondary: z.string(),
      accent: z.string(),
    }),
    cardStyle: z.enum(["integrated-soft", "premium-editorial", "marketplace-clean"]),
    density: z.enum(["low", "medium", "high"]),
    radius: z.number(),
    headlinePosition: z.enum(["top", "bottom"]),
    accentElements: z.array(z.string()).default([]),
  })
  .passthrough();

export const briefRequestSchema = infographicInputSchema.extend({
  styleProfile: styleProfileSchema.optional(),
});

export const extractStyleSchema = z.object({
  referenceImageDataUrl: z.string().min(1),
});

const overlayPlanSchema = z.object({
  width: z.number(),
  height: z.number(),
  elements: z.array(z.record(z.any())),
});

export const infographicBriefSchema = z.object({
  id: z.string(),
  type: z.string(),
  style: z.string(),
  headline: z.string(),
  subheadline: z.string().optional(),
  blocks: z.array(z.record(z.any())),
  layout: z.string(),
  palette: z.array(z.string()),
  backgroundPrompt: z.string(),
  imagePrompt: z.string().min(1),
  negativePrompt: z.string(),
  overlayPlan: overlayPlanSchema,
  warnings: z.array(z.string()).default([]),
});

export const infographicGenerateSchema = z.object({
  brief: infographicBriefSchema,
  referenceImage: z.string().optional(),
  aspectRatio: z.enum(["3:4", "4:5"]).optional(),
});
