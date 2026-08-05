import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { MERCADOS } from "@/lib/mercados";
import { obtenerPosicionesConPrecio } from "@/lib/posiciones";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posiciones = await obtenerPosicionesConPrecio();
    return NextResponse.json({ posiciones });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudieron obtener las cotizaciones en este momento." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ticker = String(body.ticker ?? "").trim().toUpperCase();
  const nombre = String(body.nombre ?? "").trim().slice(0, 100) || ticker;
  const cantidad = Number(body.cantidad);
  const ppc =
    body.ppc !== undefined && body.ppc !== null && body.ppc !== ""
      ? Number(body.ppc)
      : null;

  if (!ticker) {
    return NextResponse.json({ error: "Falta el ticker" }, { status: 400 });
  }
  if (!cantidad || cantidad <= 0) {
    return NextResponse.json(
      { error: "La cantidad tiene que ser mayor a 0" },
      { status: 400 }
    );
  }
  if (ppc !== null && (!ppc || ppc <= 0)) {
    return NextResponse.json(
      { error: "El PPC tiene que ser mayor a 0" },
      { status: 400 }
    );
  }

  const mercadosValidos: readonly string[] = MERCADOS;
  const mercado = mercadosValidos.includes(body.mercado) ? body.mercado : "cedear";

  // Si ya tenés esa misma posición cargada, se suma en vez de duplicar la fila.
  const { data: existente, error: errorBusqueda } = await supabaseAdmin
    .from("posiciones")
    .select("*")
    .eq("ticker", ticker)
    .eq("mercado", mercado)
    .maybeSingle();

  if (errorBusqueda) {
    return NextResponse.json({ error: errorBusqueda.message }, { status: 500 });
  }

  if (existente) {
    const cantidadTotal = Number(existente.cantidad) + cantidad;
    let ppcNuevo = existente.ppc;
    if (ppc !== null) {
      const ppcExistente = existente.ppc ?? ppc;
      ppcNuevo =
        (Number(existente.cantidad) * ppcExistente + cantidad * ppc) / cantidadTotal;
    }

    const { data, error } = await supabaseAdmin
      .from("posiciones")
      .update({ cantidad: cantidadTotal, ppc: ppcNuevo })
      .eq("id", existente.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ posicion: data });
  }

  const { data, error } = await supabaseAdmin
    .from("posiciones")
    .insert({ ticker, nombre, mercado, cantidad, ppc })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ posicion: data }, { status: 201 });
}
