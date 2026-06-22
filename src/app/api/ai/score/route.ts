import { parseBody, ok, fail } from "@/lib/api";
import { scoreRequestSchema } from "@/core/ai/schemas";
import { scoreGeneratedCard } from "@/core/ai/service";
import { validateDataUrl } from "@/lib/image-validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, scoreRequestSchema);
    // generated cards may be remote URLs (fal.ai); only validate uploaded data URLs
    if (body.imageDataUrl.startsWith("data:")) validateDataUrl(body.imageDataUrl);
    const score = await scoreGeneratedCard(body);
    return ok(score);
  } catch (err) {
    return fail(err);
  }
}
