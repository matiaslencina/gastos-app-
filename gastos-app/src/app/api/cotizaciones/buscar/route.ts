import { NextRequest, NextResponse } from "next/server";
import { MERCADOS } from "@/lib/mercados";
import { obtenerPanel } from "@/lib/data912";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toUpperCase();
  if (!q) {
    return NextResponse.json({ resultados: [] });
  }

  try {
    const paneles = await Promise.all(
      MERCADOS.map(async (mercado) => ({
        mercado,
        cotizaciones: await obtenerPanel(mercado),
      }))
    );

    const resultados = paneles
      .flatMap(({ mercado, cotizaciones }) =>
        cotizaciones
          .filter((c) => c.symbol.toUpperCase().includes(q))
          .map((c) => ({
            symbol: c.symbol,
            mercado,
            precio: c.c,
            pctChange: c.pct_change,
          }))
      )
      .sort((a, b) => {
        const aEmpieza = a.symbol.toUpperCase().startsWith(q) ? 0 : 1;
        const bEmpieza = b.symbol.toUpperCase().startsWith(q) ? 0 : 1;
        return aEmpieza - bEmpieza || a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 20);

    return NextResponse.json({ resultados });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudieron buscar cotizaciones en este momento." },
      { status: 500 }
    );
  }
}
