import { parseBody, ok, fail } from "@/lib/api";
import { ideasRequestSchema } from "@/core/ai/schemas";
import { generateCardIdeas } from "@/core/ai/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, ideasRequestSchema);
    const ideas = await generateCardIdeas(body.product);
    return ok({ ideas });
  } catch (err) {
    return fail(err);
  }
}
