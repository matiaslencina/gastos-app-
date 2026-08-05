import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { categorizarGasto } from "@/lib/gemini";
import { CATEGORIAS } from "@/lib/categorias";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("gastos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ gastos: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const monto = Number(body.monto);
  const descripcion = String(body.descripcion ?? "").slice(0, 200);
  const fecha = body.fecha || new Date().toISOString().slice(0, 10);

  if (!monto || monto <= 0) {
    return NextResponse.json(
      { error: "El monto tiene que ser mayor a 0" },
      { status: 400 }
    );
  }

  let categoria: string = body.categoria;
  let origen: "manual" | "ia" = "manual";
  const categoriasValidas: readonly string[] = CATEGORIAS;

  // Si no vino categoría (o vino vacía), la IA la sugiere.
  if (!categoria || !categoriasValidas.includes(categoria)) {
    try {
      categoria = await categorizarGasto(descripcion);
      origen = "ia";
    } catch {
      categoria = "Otros";
    }
  }

  const { data, error } = await supabaseAdmin
    .from("gastos")
    .insert({ monto, descripcion, categoria, fecha, origen })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ gasto: data }, { status: 201 });
}
