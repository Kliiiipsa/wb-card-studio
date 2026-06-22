import { ok } from "@/lib/api";
import { providerStatus } from "@/core/ai/providers";

export const runtime = "nodejs";

export async function GET() {
  return ok(providerStatus());
}
