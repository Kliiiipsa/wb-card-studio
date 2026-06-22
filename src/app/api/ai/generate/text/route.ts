import { parseBody, ok, fail } from "@/lib/api";
import { generateTextRequestSchema } from "@/core/ai/schemas";
import { generateImageFromText } from "@/core/ai/service";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await parseBody(req, generateTextRequestSchema);
    const result = await generateImageFromText(body);
    return ok(result);
  } catch (err) {
    return fail(err);
  }
}
