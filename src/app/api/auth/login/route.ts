import { NextResponse } from "next/server";
import { GATE_COOKIE, gateToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.ACCESS_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Доступ не настроен." }, { status: 500 });
  }
  if ((body.password ?? "") !== expected) {
    return NextResponse.json({ error: "Неверный пароль." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, await gateToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
