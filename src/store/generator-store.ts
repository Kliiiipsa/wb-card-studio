"use client";
import { create } from "zustand";
import type { CardTypeId } from "@/core/domain/card-types";
import type { StyleId } from "@/core/domain/styles";
import type { AspectRatioId } from "@/core/domain/export-presets";
import type { ProductInfo, StoredImage } from "@/core/domain/types";
import { EMPTY_PRODUCT } from "@/core/domain/types";

export interface GeneratedVariant {
  id: string;
  url: string;
  width?: number;
  height?: number;
}

export type GenStatus = "idle" | "building" | "generating" | "scoring" | "done" | "error";

interface GeneratorState {
  product: ProductInfo;
  cardType: CardTypeId;
  style: StyleId;
  aspectRatio: AspectRatioId;
  userPrompt: string;
  negativePrompt: string;
  finalPrompt: string;

  reference: StoredImage | null;
  referenceStrength: number;

  variants: GeneratedVariant[];
  selectedVariantId: string | null;
  status: GenStatus;
  error: string | null;

  setProduct: (patch: Partial<ProductInfo>) => void;
  setField: <K extends keyof GeneratorState>(key: K, value: GeneratorState[K]) => void;
  setReference: (img: StoredImage | null) => void;
  setVariants: (v: GeneratedVariant[]) => void;
  selectVariant: (id: string) => void;
  reset: () => void;
}

export const DEFAULT_NEGATIVE =
  "низкое качество, размыто, дешёвый дизайн, искажённый товар, случайный текст, лишние объекты, водяной знак";

export const useGeneratorStore = create<GeneratorState>((set) => ({
  product: { ...EMPTY_PRODUCT },
  cardType: "cover",
  style: "premium-minimal",
  aspectRatio: "3:4",
  userPrompt: "",
  negativePrompt: DEFAULT_NEGATIVE,
  finalPrompt: "",

  reference: null,
  referenceStrength: 0.45,

  variants: [],
  selectedVariantId: null,
  status: "idle",
  error: null,

  setProduct: (patch) => set((s) => ({ product: { ...s.product, ...patch } })),
  setField: (key, value) => set({ [key]: value } as Partial<GeneratorState>),
  setReference: (img) => set({ reference: img }),
  setVariants: (v) =>
    set({ variants: v, selectedVariantId: v[0]?.id ?? null }),
  selectVariant: (id) => set({ selectedVariantId: id }),
  reset: () =>
    set({
      variants: [],
      selectedVariantId: null,
      status: "idle",
      error: null,
      finalPrompt: "",
    }),
}));
