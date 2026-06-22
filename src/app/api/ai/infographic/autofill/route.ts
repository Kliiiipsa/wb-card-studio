import { parseBody, ok, fail } from "@/lib/api";
import { autofillSchema } from "@/core/infographics/schemas";
import { autofillFromImage } from "@/core/infographics/infographic-service";
import { validateDataUrl } from "@/lib/image-validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, autofillSchema);
    if (body.imageDataUrl.startsWith("data:")) validateDataUrl(body.imageDataUrl);
    const result = await autofillFromImage(body);
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}
