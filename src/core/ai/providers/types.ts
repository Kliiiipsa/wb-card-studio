/** ---------- LLM provider ---------- */

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
  /** optional image (data URL) for vision models */
  imageDataUrl?: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  /** ask the model to return strict JSON */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  /** hint that a vision-capable model is required */
  vision?: boolean;
  /**
   * Task discriminator + context. Real providers IGNORE these and rely only on
   * `messages`. The mock provider uses them to synthesise realistic responses
   * without a real model.
   */
  task?:
    | "analyze"
    | "ideas"
    | "improve-prompt"
    | "build-prompt"
    | "score"
    | "translate";
  context?: Record<string, unknown>;
}

export interface LLMResult {
  text: string;
}

export interface LLMProvider {
  readonly id: string;
  complete(req: LLMRequest): Promise<LLMResult>;
}

/** ---------- Image provider ---------- */

export interface T2IRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  count?: number;
}

export interface I2IRequest extends T2IRequest {
  referenceImageDataUrl: string;
  /** 0..1 — lower preserves the source product more strongly */
  strength?: number;
}

export interface GeneratedImage {
  /** data URL or remote URL depending on provider */
  url: string;
  width?: number;
  height?: number;
}

export interface ImageResult {
  images: GeneratedImage[];
  provider: string;
}

export interface ImageProvider {
  readonly id: string;
  textToImage(req: T2IRequest): Promise<ImageResult>;
  imageToImage(req: I2IRequest): Promise<ImageResult>;
}
