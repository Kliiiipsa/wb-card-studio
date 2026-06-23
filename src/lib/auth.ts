/**
 * Minimal access gate (single shared password, no accounts, no personal data).
 * The cookie holds a hash of the password — never the password itself — so it
 * can't be read back and auto-invalidates if the password changes.
 *
 * Web Crypto only → works in both the Edge middleware and Node route handlers.
 */
export const GATE_COOKIE = "wb_gate";

export async function gateToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`wb-card-studio-gate:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
