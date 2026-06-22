import type { LLMProvider, LLMRequest, LLMResult, LLMMessage } from "../types";
import { ProviderError } from "@/lib/errors";

/**
 * Qwen via Alibaba DashScope OpenAI-compatible endpoint.
 * Enabled by setting AI_LLM_PROVIDER=qwen and QWEN_API_KEY.
 *
 * Uses the text model by default and automatically switches to the vision
 * model when a request carries an image or sets `vision: true`.
 */
export class QwenLLMProvider implements LLMProvider {
  readonly id = "qwen";

  private apiKey = process.env.QWEN_API_KEY ?? "";
  private baseUrl =
    process.env.QWEN_BASE_URL ??
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
  private textModel = process.env.QWEN_TEXT_MODEL ?? "qwen-plus";
  private visionModel = process.env.QWEN_VISION_MODEL ?? "qwen-vl-max";

  async complete(req: LLMRequest): Promise<LLMResult> {
    if (!this.apiKey) {
      throw new ProviderError(
        "AI-провайдер не настроен. Добавьте QWEN_API_KEY в переменные окружения.",
        "missing QWEN_API_KEY",
      );
    }

    const needsVision = req.vision || req.messages.some((m) => m.imageDataUrl);
    const model = needsVision ? this.visionModel : this.textModel;

    const body: Record<string, unknown> = {
      model,
      messages: req.messages.map(toOpenAIMessage),
      temperature: req.temperature ?? 0.7,
    };
    if (req.maxTokens) body.max_tokens = req.maxTokens;
    if (req.json) body.response_format = { type: "json_object" };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch (e) {
      throw new ProviderError(
        "Не удалось связаться с AI-сервисом. Попробуйте позже.",
        `qwen fetch failed: ${String(e)}`,
      );
    }

    if (!res.ok) {
      const detail = await safeText(res);
      throw new ProviderError(
        "AI-сервис вернул ошибку. Попробуйте ещё раз.",
        `qwen ${res.status}: ${detail}`,
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) {
      throw new ProviderError("AI-сервис вернул пустой ответ.", "qwen empty content");
    }
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
