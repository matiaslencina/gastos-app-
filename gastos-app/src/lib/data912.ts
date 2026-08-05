// Cliente para data912.com: API pública gratuita de cotizaciones argentinas
// (CEDEARs, bonos, acciones), sin API key. No tiene garantía de uptime al ser
// un servicio comunitario, pero cubre justo lo que necesitamos.

export type CotizacionData912 = {
  symbol: string;
  c: number; // último precio
  pct_change: number; // variación % del día
};

const ENDPOINT_POR_MERCADO: Record<string, string> = {
  cedear: "/live/arg_cedears",
  bono: "/live/arg_bonds",
  lecap: "/live/arg_notes",
  accion: "/live/arg_stocks",
};

// Cache corto en memoria: la lista de tickers de cada panel casi no cambia
// intradía, así que no hace falta pegarle a data912 en cada letra que
// escribe el usuario en el buscador.
const TTL_MS = 30_000;
const cache = new Map<string, { data: CotizacionData912[]; fetchedAt: number }>();

export async function obtenerPanel(mercado: string): Promise<CotizacionData912[]> {
  const endpoint = ENDPOINT_POR_MERCADO[mercado];
  if (!endpoint) return [];

  const cacheado = cache.get(mercado);
  if (cacheado && Date.now() - cacheado.fetchedAt < TTL_MS) {
    return cacheado.data;
  }

  const res = await fetch(`https://data912.com${endpoint}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("No se pudieron obtener las cotizaciones");
  }
  const data: CotizacionData912[] = await res.json();
  cache.set(mercado, { data, fetchedAt: Date.now() });
  return data;
}
