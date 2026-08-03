"use client";

import type { Gasto } from "@/lib/supabase";

function formatearFecha(fecha: string) {
  const d = new Date(fecha + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export default function GastoList({
  gastos,
  cargando,
  onBorrar,
}: {
  gastos: Gasto[];
  cargando: boolean;
  onBorrar: (id: string) => void;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="h-3 bg-paper-100 ticket-edge-top" />
      <div className="bg-paper-100 text-ink-950 px-5 py-4">
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-ink-950/50 mb-3">
          Ticket de gastos
        </p>

        {cargando && (
          <p className="text-center text-xs text-ink-950/40 py-6">
            Cargando...
          </p>
        )}

        {!cargando && gastos.length === 0 && (
          <p className="text-center text-xs text-ink-950/40 py-6">
            Todavía no hay gastos. Cargá el primero arriba.
          </p>
        )}

        <ul className="flex flex-col divide-y divide-ink-950/10">
          {gastos.map((g) => (
            <li
              key={g.id}
              className="print-line group flex items-center justify-between gap-2 py-2 text-sm"
            >
              <span className="text-ink-950/40 text-xs w-10 shrink-0">
                {formatearFecha(g.fecha)}
              </span>
              <span className="flex-1 truncate">
                {g.descripcion || g.categoria}
                <span className="text-ink-950/40 text-xs ml-1.5">
                  · {g.categoria}
                </span>
              </span>
              <span className="font-medium tabular-nums shrink-0">
                ${Number(g.monto).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <button
                onClick={() => onBorrar(g.id)}
                aria-label="Borrar gasto"
                className="opacity-0 group-hover:opacity-100 text-ink-950/30 hover:text-led-red text-xs shrink-0 transition-opacity"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="h-3 bg-paper-100 ticket-edge-bottom" />
    </div>
  );
}
