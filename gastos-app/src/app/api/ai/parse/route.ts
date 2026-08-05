import { NextRequest, NextResponse } from "next/server";
import { parseGastoDesdeTexto } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { texto } = await req.json();

  if (!texto || typeof texto !== "string" || !texto.trim()) {
    return NextResponse.json({ error: "Falta el texto" }, { status: 400 });
  }

  try {
    const parseado = await parseGastoDesdeTexto(texto);

    const { data, error } = await supabaseAdmin
      .from("gastos")
      .insert({ ...parseado, origen: "ia" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ gasto: data }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No pude interpretar ese gasto, probá de nuevo o cargalo manual." },
      { status: 500 }
    );
  }
}
