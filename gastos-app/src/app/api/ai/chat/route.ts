import { NextRequest, NextResponse } from "next/server";
import { obtenerPosicionesConPrecio } from "@/lib/posiciones";
import { consultarAsistenteMercado } from "@/lib/gemini";
import type { MensajeChat } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pregunta = String(body.pregunta ?? "").trim();
  const historial: MensajeChat[] = Array.isArray(body.historial)
    ? body.historial
    : [];

  if (!pregunta) {
    return NextResponse.json({ error: "Falta la pregunta" }, { status: 400 });
  }

  try {
    const posiciones = await obtenerPosicionesConPrecio();
    const respuesta = await consultarAsistenteMercado(
      pregunta,
      historial,
      posiciones
    );
    return NextResponse.json({ respuesta });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No pude responder en este momento, probá de nuevo." },
      { status: 500 }
    );
  }
}
