export const MERCADOS = ["cedear", "bono", "lecap", "accion"] as const;

export type Mercado = (typeof MERCADOS)[number];

export const MERCADO_LABEL: Record<Mercado, string> = {
  cedear: "CEDEAR",
  bono: "Bono",
  lecap: "LECAP",
  accion: "Acción",
};
