"use client";
import type {
  AnalysisReport,
  CardIdea,
  CardScore,
  ProductInfo,
  StructuredImagePrompt,
} from "@/core/domain/types";
import type { ImageResult } from "@/core/ai/providers/types";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Ошибка запроса");
  }
  return data as T;
}

export const api = {
  analyze: (imageDataUrl: string, product?: Partial<ProductInfo>) =>
    post<AnalysisReport>("/api/ai/analyze", { imageDataUrl, product }),

  ideas: (product: ProductInfo) =>
    post<{ ideas: CardIdea[] }>("/api/ai/ideas", { product }),

  improvePrompt: (prompt: string, cardType?: string, style?: string) =>
    post<{ prompt: string }>("/api/ai/improve-prompt", { prompt, cardType, style }),

  buildPrompt: (args: {
    product: ProductInfo;
    cardType: string;
    style: string;
    userPrompt?: string;
  }) => post<StructuredImagePrompt>("/api/ai/build-prompt", args),

  generateText: (args: {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: string;
    count?: number;
    cardText?: string;
  }) => post<ImageResult>("/api/ai/generate/text", args),

  generateImage: (args: {
    prompt: string;
    negativePrompt?: string;
    referenceImageDataUrl: string;
    strength?: number;
    aspectRatio?: string;
    count?: number;
    cardText?: string;
  }) => post<ImageResult>("/api/ai/generate/image", args),

  score: (args: { imageDataUrl: string; product?: Partial<ProductInfo>; cardType?: string }) =>
    post<CardScore>("/api/ai/score", args),

  status: async () => {
    const res = await fetch("/api/ai/status");
    return (await res.json()) as { llm: string; image: string };
  },
};
