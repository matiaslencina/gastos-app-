import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { MERCADOS } from "@/lib/mercados";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const mercadosValidos: readonly string[] = MERCADOS;
  const cambios: Record<string, unknown> = {};

  if (body.ticker !== undefined) {
    const ticker = String(body.ticker).trim().toUpperCase();
    if (!ticker) {
      return NextResponse.json({ error: "Falta el ticker" }, { status: 400 });
    }
    cambios.ticker = ticker;
  }

  if (body.nombre !== undefined) {
    const nombre = String(body.nombre).trim().slice(0, 100);
    if (!nombre) {
      return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });
    }
    cambios.nombre = nombre;
  }

  if (body.mercado !== undefined) {
    if (!mercadosValidos.includes(body.mercado)) {
      return NextResponse.json({ error: "Mercado inválido" }, { status: 400 });
    }
    cambios.mercado = body.mercado;
  }

  if (body.cantidad !== undefined) {
    const cantidad = Number(body.cantidad);
    if (!cantidad || cantidad <= 0) {
      return NextResponse.json(
        { error: "La cantidad tiene que ser mayor a 0" },
        { status: 400 }
      );
    }
    cambios.cantidad = cantidad;
  }

  if (body.ppc !== undefined) {
    if (body.ppc === null || body.ppc === "") {
      cambios.ppc = null;
    } else {
      const ppc = Number(body.ppc);
      if (!ppc || ppc <= 0) {
        return NextResponse.json(
          { error: "El PPC tiene que ser mayor a 0" },
          { status: 400 }
        );
      }
      cambios.ppc = ppc;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("posiciones")
    .update(cambios)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ posicion: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabaseAdmin
    .from("posiciones")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
