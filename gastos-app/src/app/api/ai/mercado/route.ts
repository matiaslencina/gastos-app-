import { NextResponse } from "next/server";
import { obtenerPosicionesConPrecio } from "@/lib/posiciones";
import { obtenerPanel } from "@/lib/data912";
import { generarResumenMercado } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posiciones = await obtenerPosicionesConPrecio();
    const panelCedears = await obtenerPanel("cedear");

    const ordenado = [...panelCedears].sort(
      (a, b) => (b.pct_change ?? 0) - (a.pct_change ?? 0)
    );
    const topSubas = ordenado.slice(0, 5);
    const topBajas = ordenado.slice(-5).reverse();

    const resumen = await generarResumenMercado(posiciones, topSubas, topBajas);
    return NextResponse.json({ resumen });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No pude generar el resumen del mercado en este momento." },
      { status: 500 }
    );
  }
}
