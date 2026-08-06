"use client";

import { useState } from "react";
import { CATEGORIAS } from "@/lib/categorias";
import type { Gasto } from "@/lib/supabase";

function formatearFecha(fecha: string) {
  const d = new Date(fecha + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export default function GastoList({
  gastos,
  cargando,
  onBorrar,
  onEditar,
}: {
  gastos: Gasto[];
  cargando: boolean;
  onBorrar: (id: string) => void;
  onEditar: (id: string, cambios: Partial<Gasto>) => void;
}) {
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md rounded-3xl overflow-hidden">
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
          {gastos.map((g) =>
            editandoId === g.id ? (
              <FilaEdicion
                key={g.id}
                gasto={g}
                onGuardar={(cambios) => {
                  onEditar(g.id, cambios);
                  setEditandoId(null);
                }}
                onCancelar={() => setEditandoId(null)}
              />
            ) : (
              <FilaGasto
                key={g.id}
                gasto={g}
                expandido={expandidoId === g.id}
                onToggleExpandir={() =>
                  setExpandidoId(expandidoId === g.id ? null : g.id)
                }
                onEditar={() => setEditandoId(g.id)}
                onBorrar={() => onBorrar(g.id)}
              />
            )
          )}
        </ul>
      </div>
      <div className="h-3 bg-paper-100 ticket-edge-bottom" />
    </div>
  );
}

function FilaGasto({
  gasto: g,
  expandido,
  onToggleExpandir,
  onEditar,
  onBorrar,
}: {
  gasto: Gasto;
  expandido: boolean;
  onToggleExpandir: () => void;
  onEditar: () => void;
  onBorrar: () => void;
}) {
  return (
    <li className="print-line flex flex-col py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-950/40 text-xs w-10 shrink-0">
          {formatearFecha(g.fecha)}
        </span>
        <button
          type="button"
          onClick={onToggleExpandir}
          className="flex-1 truncate text-left"
        >
          {g.descripcion || g.categoria}
          <span className="text-ink-950/40 text-xs ml-1.5">
            · {g.categoria}
          </span>
        </button>
        <span className="font-medium tabular-nums shrink-0">
          ${Number(g.monto).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
          })}
        </span>
        <button
          onClick={onEditar}
          aria-label="Editar gasto"
          className="rounded-full text-ink-950/40 hover:text-led-amber hover:bg-ink-950/5 text-sm px-2 py-1.5 -my-1.5 shrink-0"
        >
          ✎
        </button>
        <button
          onClick={onBorrar}
          aria-label="Borrar gasto"
          className="rounded-full text-ink-950/40 hover:text-led-red hover:bg-ink-950/5 text-sm px-2 py-1.5 -my-1.5 shrink-0"
        >
          ✕
        </button>
      </div>
      {expandido && (
        <p className="text-xs text-ink-950/60 mt-1 pl-10 pr-2">
          {g.descripcion || g.categoria} · {g.categoria}
        </p>
      )}
    </li>
  );
}

function FilaEdicion({
  gasto,
  onGuardar,
  onCancelar,
}: {
  gasto: Gasto;
  onGuardar: (cambios: Partial<Gasto>) => void;
  onCancelar: () => void;
}) {
  const [monto, setMonto] = useState(String(gasto.monto));
  const [fecha, setFecha] = useState(gasto.fecha);
  const [descripcion, setDescripcion] = useState(gasto.descripcion);
  const [categoria, setCategoria] = useState(gasto.categoria);

  return (
    <li className="flex flex-col gap-2 py-2">
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-24 bg-paper-200 border border-ink-950/20 rounded-2xl px-2 py-1 text-sm text-ink-950"
        />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="bg-paper-200 border border-ink-950/20 rounded-2xl px-2 py-1 text-sm text-ink-950"
        />
      </div>
      <input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        className="bg-paper-200 border border-ink-950/20 rounded-2xl px-2 py-1 text-sm text-ink-950"
      />
      <div className="flex gap-2 items-center">
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="flex-1 bg-paper-200 border border-ink-950/20 rounded-2xl px-2 py-1 text-sm text-ink-950"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            onGuardar({ monto: Number(monto), fecha, descripcion, categoria })
          }
          className="text-xs text-led-green px-2 py-1.5"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="text-xs text-ink-950/50 px-2 py-1.5"
        >
          Cancelar
        </button>
      </div>
    </li>
  );
}
