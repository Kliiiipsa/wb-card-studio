"use client";
import { useCallback } from "react";
import { useGeneratorStore, type GeneratedVariant } from "@/store/generator-store";
import { useProjectStore } from "@/store/project-store";
import { api } from "@/lib/client-api";
import { toast } from "@/components/ui/toaster";
import { uid } from "@/lib/utils";
import type { Generation } from "@/core/domain/types";

/**
 * Orchestrates the full generation pipeline used by the Generator and Prompt
 * Studio: (optionally build a structured prompt) → generate variants → score →
 * persist to the active project.
 */
export function useCardGeneration() {
  const gen = useGeneratorStore();
  const project = useProjectStore();

  const generate = useCallback(
    async (opts?: { buildPrompt?: boolean; promptOverride?: string }) => {
      const s = useGeneratorStore.getState();
      try {
        gen.setField("error", null);

        // 1. Build the final prompt
        let finalPrompt = opts?.promptOverride ?? s.userPrompt;
        if (opts?.buildPrompt && s.product.name) {
          gen.setField("status", "building");
          const structured = await api.buildPrompt({
            product: s.product,
            cardType: s.cardType,
            style: s.style,
            userPrompt: s.userPrompt,
          });
          finalPrompt = structured.rendered;
        }
        if (!finalPrompt.trim()) {
          toast.error("Введите промпт или заполните данные товара.");
          gen.setField("status", "idle");
          return;
        }
        gen.setField("finalPrompt", finalPrompt);

        // 2. Generate (text-to-image or image-to-image)
        // short Russian headline rendered on the card (kept in Russian)
        const cardText = (s.product.benefits[0] || s.product.name || "").trim().slice(0, 60) || undefined;
        gen.setField("status", "generating");
        const result = s.reference
          ? await api.generateImage({
              prompt: finalPrompt,
              negativePrompt: s.negativePrompt,
              referenceImageDataUrl: s.reference.dataUrl,
              strength: s.referenceStrength,
              aspectRatio: s.aspectRatio,
              count: 1,
              cardText,
            })
          : await api.generateText({
              prompt: finalPrompt,
              negativePrompt: s.negativePrompt,
              aspectRatio: s.aspectRatio,
              count: 1,
              cardText,
            });

        const variants: GeneratedVariant[] = result.images.map((img) => ({
          id: uid("var"),
          url: img.url,
          width: img.width,
          height: img.height,
        }));
        gen.setVariants(variants);

        // 3. Score the first variant (best-effort; non-fatal)
        gen.setField("status", "scoring");
        let score;
        try {
          score = await api.score({
            imageDataUrl: variants[0].url,
            product: s.product,
            cardType: s.cardType,
          });
        } catch {
          // scoring is non-critical
        }

        // 4. Persist if a project is open
        if (project.current) {
          const record: Generation = {
            id: uid("gen"),
            projectId: project.current.id,
            mode: s.reference ? "image-to-image" : "text-to-image",
            params: {
              cardType: s.cardType,
              style: s.style,
              aspectRatio: s.aspectRatio,
              userPrompt: s.userPrompt,
              negativePrompt: s.negativePrompt,
              finalPrompt,
              referenceStrength: s.reference ? s.referenceStrength : undefined,
              referenceImageId: s.reference?.id,
            },
            images: variants.map((v) => ({
              id: v.id,
              dataUrl: v.url,
              width: v.width,
              height: v.height,
              createdAt: Date.now(),
            })),
            score,
            createdAt: Date.now(),
          };
          await project.addGeneration(record);
        }

        gen.setField("status", "done");
        toast.success("Карточка сгенерирована");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ошибка генерации";
        gen.setField("error", msg);
        gen.setField("status", "error");
        toast.error(msg);
      }
    },
    [gen, project],
  );

  const improvePrompt = useCallback(async () => {
    const s = useGeneratorStore.getState();
    if (!s.userPrompt.trim()) {
      toast.error("Сначала введите черновой промпт.");
      return;
    }
    try {
      const { prompt } = await api.improvePrompt(s.userPrompt, s.cardType, s.style);
      gen.setField("userPrompt", prompt);
      toast.success("Промпт улучшен");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось улучшить промпт");
    }
  }, [gen]);

  return { generate, improvePrompt };
}
