import type { ProductInfo } from "@/core/domain/types";

/** Structured plan of a marketplace card, produced by the strategy engine. */
export type CardStrategy = {
  cardType: string;
  targetAudience: string;
  mainMessage: string;
  subMessage?: string;
  benefits: string[];
  visualConcept: string;
  composition: {
    productPlacement: string;
    textZones: string[];
    safeZones: string[];
    background: string;
    lighting: string;
    accentElements: string[];
  };
  typography: {
    headlineStyle: string;
    textDensity: "low" | "medium" | "high";
    maxHeadlineWords: number;
  };
  colors: {
    palette: string[];
    mood: string;
  };
  wbChecklist: string[];
  /** English prompt for the image model (no text rendering expected) */
  imagePrompt: string;
  negativePrompt: string;
};

/** Professional, WB-specific analysis of an existing card. */
export type WBCardAnalysis = {
  summary: string;
  mainProblem: string;
  conversionBlockers: string[];
  strengths: string[];
  firstScreenIssues: string[];
  readabilityIssues: string[];
  trustIssues: string[];
  designIssues: string[];
  recommendations: {
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    expectedImpact: string;
  }[];
  suggestedCards: {
    cardType: string;
    goal: string;
    headline: string;
    visualIdea: string;
  }[];
  scores: {
    cover: number;
    readability: number;
    composition: number;
    trust: number;
    premium: number;
    conversion: number;
    overall: number;
  };
};

export type StrategyInput = {
  product: Partial<ProductInfo>;
  cardType: string;
  style: string;
  userPrompt?: string;
  /** optional results from an earlier card analysis */
  analysis?: Partial<WBCardAnalysis> | null;
};
