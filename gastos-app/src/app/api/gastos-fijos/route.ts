import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { CATEGORIAS } from "@/lib/categorias";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("gastos_fijos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Las cuotas que ya se terminaron de pagar no se muestran más.
  const gastosFijos = (data ?? []).filter(
    (g) => g.cuotas_totales == null || g.cuotas_pagadas < g.cuotas_totales
  );
  return NextResponse.json({ gastosFijos });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const monto = Number(body.monto);
  const descripcion = String(body.descripcion ?? "").slice(0, 200);

  if (!monto || monto <= 0) {
    return NextResponse.json(
      { error: "El monto tiene que ser mayor a 0" },
      { status: 400 }
    );
  }

  const categoriasValidas: readonly string[] = CATEGORIAS;
  const categoria = categoriasValidas.includes(body.categoria)
    ? body.categoria
    : "Otros";

  let cuotas_totales: number | null = null;
  let cuotas_pagadas = 0;

  if (body.cuotas_totales !== undefined && body.cuotas_totales !== null) {
    cuotas_totales = Number(body.cuotas_totales);
    if (!cuotas_totales || cuotas_totales <= 0) {
      return NextResponse.json(
        { error: "La cantidad de cuotas tiene que ser mayor a 0" },
        { status: 400 }
      );
    }
    cuotas_pagadas = Number(body.cuotas_pagadas ?? 0);
    if (cuotas_pagadas < 0 || cuotas_pagadas > cuotas_totales) {
      return NextResponse.json(
        { error: "Las cuotas pagadas no pueden ser más que el total" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("gastos_fijos")
    .insert({ monto, descripcion, categoria, cuotas_totales, cuotas_pagadas })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ gastoFijo: data }, { status: 201 });
}
