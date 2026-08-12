import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { usuario } = await req.json();

  if (!usuario || usuario !== process.env.AUTH_USERNAME) {
    return NextResponse.json({ error: "Usuario incorrecto" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", process.env.AUTH_SECRET as string, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
