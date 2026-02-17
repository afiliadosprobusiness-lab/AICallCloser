import { NextResponse } from "next/server";

export function apiError(status: number, message: string, code?: string) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        message,
        code: code ?? "API_ERROR",
      },
    },
    { status },
  );
}

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}
