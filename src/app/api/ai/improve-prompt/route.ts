import { parseBody, ok, fail } from "@/lib/api";
import { improvePromptRequestSchema } from "@/core/ai/schemas";
import { improveUserPrompt } from "@/core/ai/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, improvePromptRequestSchema);
    const prompt = await improveUserPrompt(body);
    return ok({ prompt });
  } catch (err) {
    return fail(err);
  }
}
