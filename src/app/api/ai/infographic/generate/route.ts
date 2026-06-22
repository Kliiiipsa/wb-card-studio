import { parseBody, ok, fail } from "@/lib/api";
import { infographicGenerateSchema } from "@/core/infographics/schemas";
import { generateInfographicBase } from "@/core/infographics/infographic-service";
import type { InfographicBrief } from "@/core/infographics/types";
import { validateDataUrl } from "@/lib/image-validation";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, infographicGenerateSchema);
    if (body.referenceImage?.startsWith("data:")) validateDataUrl(body.referenceImage);
    const brief = body.brief as unknown as InfographicBrief;
    const baseImageUrl = await generateInfographicBase({
      brief,
      referenceImage: body.referenceImage,
      aspectRatio: body.aspectRatio,
    });
    return ok({ baseImageUrl, overlayPlan: brief.overlayPlan, brief });
  } catch (err) {
    return fail(err);
  }
}
