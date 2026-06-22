import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, toErrorResponse } from "./errors";

/** Parse + validate a JSON request body against a Zod schema. */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError("Некорректное тело запроса.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.errors[0];
    throw new AppError(first?.message ?? "Проверьте корректность данных.");
  }
  return result.data;
}

export function ok<T>(data: T) {
  return NextResponse.json(data);
}

export function fail(err: unknown) {
  const { status, body } = toErrorResponse(err);
  return NextResponse.json(body, { status });
}
