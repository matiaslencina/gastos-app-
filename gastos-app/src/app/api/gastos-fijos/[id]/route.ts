import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { CATEGORIAS } from "@/lib/categorias";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const categoriasValidas: readonly string[] = CATEGORIAS;
  const cambios: Record<string, unknown> = {};

  if (body.monto !== undefined) {
    const monto = Number(body.monto);
    if (!monto || monto <= 0) {
      return NextResponse.json(
        { error: "El monto tiene que ser mayor a 0" },
        { status: 400 }
      );
    }
    cambios.monto = monto;
  }

  if (body.descripcion !== undefined) {
    cambios.descripcion = String(body.descripcion).slice(0, 200);
  }

  if (body.categoria !== undefined) {
    cambios.categoria = categoriasValidas.includes(body.categoria)
      ? body.categoria
      : "Otros";
  }

  if (body.cuotas_totales !== undefined) {
    const cuotasTotales = Number(body.cuotas_totales);
    if (!cuotasTotales || cuotasTotales <= 0) {
      return NextResponse.json(
        { error: "La cantidad de cuotas tiene que ser mayor a 0" },
        { status: 400 }
      );
    }
    cambios.cuotas_totales = cuotasTotales;
  }

  if (body.cuotas_pagadas !== undefined) {
    const cuotasPagadas = Number(body.cuotas_pagadas);
    if (cuotasPagadas < 0) {
      return NextResponse.json(
        { error: "Las cuotas pagadas no pueden ser negativas" },
        { status: 400 }
      );
    }
    cambios.cuotas_pagadas = cuotasPagadas;
  }

  const { data, error } = await supabaseAdmin
    .from("gastos_fijos")
    .update(cambios)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ gastoFijo: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabaseAdmin
    .from("gastos_fijos")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
