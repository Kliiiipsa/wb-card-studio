import type { LLMProvider, LLMRequest, LLMResult, LLMMessage } from "../types";
import { ProviderError } from "@/lib/errors";

/**
 * GLEN LLM provider — scaffold.
 *
 * The exact GLEN API (endpoint + request/response shape) is not known yet, so
 * this is an OpenAI-compatible-style placeholder. To enable:
 *   1. set AI_TEXT_PROVIDER=glen
 *   2. set GLEN_API_KEY and GLEN_BASE_URL (and optionally GLEN_MODEL)
 *   3. adjust `endpointPath`, the auth header and the response parsing below to
 *      match GLEN's real contract (search for the TODO markers).
 *
 * Until the real endpoint is configured, it fails gracefully with a clear,
 * user-safe message instead of crashing the app.
 */
export class GlenLLMProvider implements LLMProvider {
  readonly id = "glen";

  private apiKey = process.env.GLEN_API_KEY ?? "";
  private baseUrl = process.env.GLEN_BASE_URL ?? "";
  private model = process.env.GLEN_MODEL ?? "glen-default";

  async complete(req: LLMRequest): Promise<LLMResult> {
    if (!this.apiKey || !this.baseUrl) {
      throw new ProviderError(
        "Провайдер GLEN ещё не настроен. Укажите GLEN_API_KEY и GLEN_BASE_URL, либо выберите другого провайдера.",
        "GLEN not configured (missing GLEN_API_KEY / GLEN_BASE_URL)",
      );
    }

    // TODO: replace with GLEN's real endpoint path if it differs.
    const endpointPath = "/v1/chat/completions";

    const body: Record<string, unknown> = {
      model: this.model,
      messages: req.messages.map(toOpenAIMessage),
      temperature: req.temperature ?? 0.7,
    };
    if (req.maxTokens) body.max_tokens = req.maxTokens;

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${endpointPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // TODO: adjust if GLEN uses a different auth scheme (Api-Key / X-Api-Key)
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch (e) {
      throw new ProviderError(
        "Не удалось связаться с GLEN. Попробуйте позже.",
        `glen fetch failed: ${String(e)}`,
      );
    }

    if (!res.ok) {
      const detail = await safeText(res);
      throw new ProviderError(
        "GLEN вернул ошибку. Попробуйте ещё раз.",
        `glen ${res.status}: ${detail}`,
      );
    }

    // TODO: adjust to GLEN's real response shape.
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new ProviderError("GLEN вернул пустой ответ.", "glen empty content");
    return { text };
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

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "<no body>";
  }
}
