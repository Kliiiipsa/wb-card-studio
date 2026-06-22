import "server-only";
import type { ImageProvider, LLMProvider } from "./types";
import { MockLLMProvider } from "./llm/mock";
import { QwenLLMProvider } from "./llm/qwen";
import { YandexLLMProvider } from "./llm/yandex";
import { MockImageProvider } from "./image/mock";
import { FalImageProvider } from "./image/fal";

let llmSingleton: LLMProvider | null = null;
let imageSingleton: ImageProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (llmSingleton) return llmSingleton;
  const choice = (process.env.AI_LLM_PROVIDER ?? "mock").toLowerCase();
  switch (choice) {
    case "yandex":
      llmSingleton = new YandexLLMProvider();
      break;
    case "qwen":
      llmSingleton = new QwenLLMProvider();
      break;
    case "mock":
    default:
      llmSingleton = new MockLLMProvider();
  }
  return llmSingleton;
}

export function getImageProvider(): ImageProvider {
  if (imageSingleton) return imageSingleton;
  const choice = (process.env.AI_IMAGE_PROVIDER ?? "mock").toLowerCase();
  switch (choice) {
    case "fal":
      imageSingleton = new FalImageProvider();
      break;
    case "mock":
    default:
      imageSingleton = new MockImageProvider();
  }
  return imageSingleton;
}

export function providerStatus() {
  return {
    llm: (process.env.AI_LLM_PROVIDER ?? "mock").toLowerCase(),
    image: (process.env.AI_IMAGE_PROVIDER ?? "mock").toLowerCase(),
  };
}
