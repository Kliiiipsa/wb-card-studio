import { parseBody, ok, fail } from "@/lib/api";
import { generateImageRequestSchema } from "@/core/ai/schemas";
import { generateImageFromReference } from "@/core/ai/service";
import { validateDataUrl } from "@/lib/image-validation";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, generateImageRequestSchema);
    validateDataUrl(body.referenceImageDataUrl);
    const result = await generateImageFromReference({
      prompt: body.prompt,
      negativePrompt: body.negativePrompt,
      referenceImageDataUrl: body.referenceImageDataUrl,
      strength: body.strength,
      aspectRatio: body.aspectRatio,
      count: body.count,
      cardText: body.cardText,
    });
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}
