import { supabaseAdmin } from "./supabase";
import type { Posicion } from "./supabase";
import { obtenerPanel } from "./data912";
import type { CotizacionData912 } from "./data912";

export type PosicionConPrecio = Posicion & {
  precioActual: number | null;
  pctChange: number | null;
  valorActual: number | null;
  ganancia: number | null;
  gananciaPorc: number | null;
};

export async function obtenerPosicionesConPrecio(): Promise<PosicionConPrecio[]> {
  const { data, error } = await supabaseAdmin.from("posiciones").select("*");

  if (error) throw new Error(error.message);
  const posiciones: Posicion[] = (data ?? []).sort((a, b) =>
    a.ticker.localeCompare(b.ticker)
  );

  const paneles = new Map<string, CotizacionData912[]>();
  for (const mercado of new Set(posiciones.map((p) => p.mercado))) {
    paneles.set(mercado, await obtenerPanel(mercado));
  }

  return posiciones.map((p) => {
    const panel = paneles.get(p.mercado) ?? [];
    const cotizacion = panel.find(
      (c) => c.symbol.toUpperCase() === p.ticker.toUpperCase()
    );

    // Bonos y LECAPs cotizan por cada 100 de valor nominal, no por unidad.
    const factorNominal = p.mercado === "bono" || p.mercado === "lecap" ? 100 : 1;

    const precioActual = cotizacion ? cotizacion.c / factorNominal : null;
    const pctChange = cotizacion?.pct_change ?? null;
    const valorActual = precioActual != null ? precioActual * p.cantidad : null;

    // El PPC se carga en la misma convención que el precio de mercado
    // (bonos/LECAPs por cada 100 nominal), así que se normaliza igual.
    const ppcUnitario = p.ppc != null ? p.ppc / factorNominal : null;
    const ganancia =
      precioActual != null && ppcUnitario != null
        ? (precioActual - ppcUnitario) * p.cantidad
        : null;
    const gananciaPorc =
      ppcUnitario != null && precioActual != null && ppcUnitario > 0
        ? (precioActual / ppcUnitario - 1) * 100
        : null;

    return { ...p, precioActual, pctChange, valorActual, ganancia, gananciaPorc };
  });
}
