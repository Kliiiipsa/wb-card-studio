import { parseBody, ok, fail } from "@/lib/api";
import { buildPromptRequestSchema } from "@/core/ai/schemas";
import { generatePromptForImageModel } from "@/core/ai/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, buildPromptRequestSchema);
    const structured = await generatePromptForImageModel(body);
    return ok(structured);
  } catch (err) {
    return fail(err);
  }
}
