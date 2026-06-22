import { parseBody, ok, fail } from "@/lib/api";
import { extractStyleSchema } from "@/core/infographics/schemas";
import { extractStyleProfile } from "@/core/infographics/infographic-service";
import { validateDataUrl } from "@/lib/image-validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, extractStyleSchema);
    if (body.referenceImageDataUrl.startsWith("data:")) validateDataUrl(body.referenceImageDataUrl);
    const profile = await extractStyleProfile(body.referenceImageDataUrl);
    return ok(profile);
  } catch (err) {
    return fail(err);
  }
}
