import type { LLMProvider, LLMRequest, LLMResult, LLMMessage } from "../types";
import { ProviderError } from "@/lib/errors";

/**
 * Qwen (and YandexGPT) models hosted in Yandex Cloud Foundation Models via the
 * OpenAI-compatible endpoint. Enabled with AI_LLM_PROVIDER=yandex.
 *
 * Differences from the DashScope/qwen adapter:
 *  - auth header is `Authorization: Api-Key <key>`
 *  - model id format: gpt://<folderId>/<model>/latest
 *  - `chat_template_kwargs.enable_thinking=false` disables Qwen3 reasoning
 *    (verified: without it the model fills `reasoning_content` and leaves
 *    `content` null, eating the token budget on chain-of-thought)
 *  - response_format is NOT sent (endpoint may reject it) — JSON is requested in
 *    the prompt and extracted defensively in the service layer.
 */
export class YandexLLMProvider implements LLMProvider {
  readonly id = "yandex";

  private apiKey = process.env.YANDEX_API_KEY ?? "";
  private folderId = process.env.YANDEX_FOLDER_ID ?? "b1g2kv9g5q3fstk360sa";
  private model = process.env.YANDEX_LLM_MODEL ?? "qwen3.6-35b-a3b";
  private baseUrl = process.env.YANDEX_BASE_URL ?? "https://ai.api.cloud.yandex.net/v1";

  async complete(req: LLMRequest): Promise<LLMResult> {
    if (!this.apiKey) {
      throw new ProviderError(
        "AI-провайдер не настроен. Добавьте YANDEX_API_KEY в переменные окружения.",
        "missing YANDEX_API_KEY",
      );
    }

    const modelUri = `gpt://${this.folderId}/${this.model}/latest`;

    const body: Record<string, unknown> = {
      model: modelUri,
      messages: req.messages.map(toOpenAIMessage),
      temperature: req.temperature ?? 0.3,
      max_tokens: req.maxTokens ?? 4000,
      // disable Qwen3 reasoning so `content` carries the answer (not null)
      chat_template_kwargs: { enable_thinking: false },
    };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch (e) {
      throw new ProviderError(
        "Не удалось связаться с AI-сервисом. Попробуйте позже.",
        `yandex fetch failed: ${String(e)}`,
      );
    }

    if (!res.ok) {
      const detail = await safeText(res);
      throw new ProviderError(
        "AI-сервис вернул ошибку. Попробуйте ещё раз.",
        `yandex ${res.status}: ${detail}`,
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) {
      throw new ProviderError("AI-сервис вернул пустой ответ.", "yandex empty content");
    }
    return { text: stripThink(text) };
  }
}

function toOpenAIMessage(m: LLMMessage) {
  if (m.imageDataUrl) {
    return {
      role: m.role,
      content: [
        { type: "text", text: m.content },
        { type: "image_url", image_url: { url: m.imageDataUrl } },
      ],
    };
  }
  return { role: m.role, content: m.content };
}

/** Remove any <think>...</think> block in case the model still emits one. */
function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "<no body>";
  }
}
