import { parseBody, ok, fail } from "@/lib/api";
import { writePromptRequestSchema } from "@/core/ai/schemas";
import { writePrompt } from "@/core/ai/service";
import { validateDataUrl } from "@/lib/image-validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, writePromptRequestSchema);
    if (body.referenceImageDataUrl?.startsWith("data:")) {
      validateDataUrl(body.referenceImageDataUrl);
    }
    const result = await writePrompt(body);
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}
