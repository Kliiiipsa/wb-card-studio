import { parseBody, ok, fail } from "@/lib/api";
import { briefRequestSchema } from "@/core/infographics/schemas";
import { buildInfographicBrief } from "@/core/infographics/infographic-service";
import type { InfographicInput, StyleProfile } from "@/core/infographics/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { styleProfile, ...input } = await parseBody(req, briefRequestSchema);
    const brief = await buildInfographicBrief(
      input as InfographicInput,
      styleProfile as StyleProfile | undefined,
    );
    return ok(brief);
  } catch (err) {
    return fail(err);
  }
}
