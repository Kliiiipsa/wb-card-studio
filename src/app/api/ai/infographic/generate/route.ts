import { parseBody, ok, fail } from "@/lib/api";
import { infographicGenerateSchema } from "@/core/infographics/schemas";
import { generateInfographicBase } from "@/core/infographics/infographic-service";
import type { InfographicBrief } from "@/core/infographics/types";
import { validateDataUrl } from "@/lib/image-validation";

export const runtime = "nodejs";
// gpt-image-2 (when AI_INFOGRAPHIC_IMAGE_PROVIDER=fal-gpt-image) can take a few
// minutes; allow headroom. Flux stays well under this.
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, infographicGenerateSchema);
    if (body.productImage?.startsWith("data:")) validateDataUrl(body.productImage);
    if (body.styleReferenceImage?.startsWith("data:")) validateDataUrl(body.styleReferenceImage);
    const brief = body.brief as unknown as InfographicBrief;
    const { baseImageUrl, textBaked } = await generateInfographicBase({
      brief,
      productImage: body.productImage,
      styleReferenceImage: body.styleReferenceImage,
      productName: body.productName,
      aspectRatio: body.aspectRatio,
    });
    return ok({ baseImageUrl, overlayPlan: brief.overlayPlan, brief, textBaked });
  } catch (err) {
    return fail(err);
  }
}
