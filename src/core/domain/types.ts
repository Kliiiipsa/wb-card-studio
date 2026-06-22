import type { CardTypeId } from "./card-types";
import type { StyleId } from "./styles";
import type { AspectRatioId } from "./export-presets";

export interface ProductInfo {
  name: string;
  category: string;
  price?: string;
  audience: string;
  benefits: string[];
  pains: string[];
}

export const EMPTY_PRODUCT: ProductInfo = {
  name: "",
  category: "",
  price: "",
  audience: "",
  benefits: [],
  pains: [],
};

/** A reference / uploaded image stored as a data URL for the MVP. */
export interface StoredImage {
  id: string;
  dataUrl: string;
  width?: number;
  height?: number;
  createdAt: number;
}

export interface GenerationParams {
  cardType: CardTypeId;
  style: StyleId;
  aspectRatio: AspectRatioId;
  userPrompt: string;
  negativePrompt: string;
  /** structured prompt actually sent to the image model */
  finalPrompt?: string;
  /** image-to-image strength (0..1) — lower = product preserved more strongly */
  referenceStrength?: number;
  referenceImageId?: string;
}

export interface Generation {
  id: string;
  projectId: string;
  mode: "text-to-image" | "image-to-image";
  params: GenerationParams;
  images: StoredImage[];
  score?: CardScore;
  createdAt: number;
}

export interface Project {
  id: string;
  title: string;
  product: ProductInfo;
  uploads: StoredImage[];
  preferredStyle?: StyleId;
  createdAt: number;
  updatedAt: number;
}

/** ---- AI result shapes (mirrored by Zod schemas in core/ai/schemas.ts) ---- */

export interface CardIdea {
  cardType: CardTypeId | string;
  title: string;
  angle: string;
  headline: string;
  keyPoints: string[];
}

export interface CardScore {
  cover: number;
  infographics: number;
  text: number;
  composition: number;
  trust: number;
  sellingPower: number;
  total: number;
  comment?: string;
}

export interface AnalysisReport {
  diagnosis: string;
  mainProblem: string;
  blockersToPurchase: string[];
  whatWorks: string[];
  fixFirst: string[];
  newCardIdeas: CardIdea[];
  textTips: string[];
  visualTips: string[];
  scores: CardScore;
  improvementPlan: string[];
}

export interface StructuredImagePrompt {
  product: string;
  marketplace: string;
  cardType: string;
  targetAudience: string;
  mainBenefit: string;
  visualStyle: string;
  composition: string;
  background: string;
  lighting: string;
  typographyArea: string;
  colorPalette: string;
  premiumDetails: string;
  restrictions: string;
  negativePrompt: string;
  /** flattened single-string prompt ready for the image model */
  rendered: string;
}
