"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIAS } from "@/lib/categorias";
import type { GastoFijo } from "@/lib/supabase";

// Para una compra en cuotas, "monto" guarda el total de la compra:
// lo que impacta cada mes es ese total dividido por la cantidad de cuotas.
function montoMensual(g: GastoFijo) {
  return g.cuotas_totales ? Number(g.monto) / g.cuotas_totales : Number(g.monto);
}

export default function GastosFijosPanel() {
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [esCuotas, setEsCuotas] = useState(false);
  const [cuotasTotales, setCuotasTotales] = useState("");
  const [cuotasPagadas, setCuotasPagadas] = useState("0");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/gastos-fijos")
      .then((res) => res.json())
      .then((data) => setGastosFijos(data.gastosFijos ?? []))
      .finally(() => setCargando(false));
  }, []);

  const totalFijo = useMemo(
    () => gastosFijos.reduce((acc, g) => acc + montoMensual(g), 0),
    [gastosFijos]
  );

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    const res = await fetch("/api/gastos-fijos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monto: Number(monto),
        descripcion,
        categoria,
        cuotas_totales: esCuotas ? Number(cuotasTotales) : null,
        cuotas_pagadas: esCuotas ? Number(cuotasPagadas || 0) : undefined,
      }),
    });
    const data = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setError(data.error ?? "Algo salió mal");
      return;
    }

    setGastosFijos((prev) => [data.gastoFijo, ...prev]);
    setMonto("");
    setDescripcion("");
    setCategoria("");
    setEsCuotas(false);
    setCuotasTotales("");
    setCuotasPagadas("0");
  }

  async function borrar(id: string) {
    setGastosFijos((prev) => prev.filter((g) => g.id !== id));
    await fetch(`/api/gastos-fijos/${id}`, { method: "DELETE" });
  }

  async function marcarCuotaPagada(g: GastoFijo) {
    const res = await fetch(`/api/gastos-fijos/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuotas_pagadas: g.cuotas_pagadas + 1 }),
    });
    const data = await res.json();
    if (!res.ok) return;

    const actualizado: GastoFijo = data.gastoFijo;
    if (
      actualizado.cuotas_totales != null &&
      actualizado.cuotas_pagadas >= actualizado.cuotas_totales
    ) {
      setGastosFijos((prev) => prev.filter((x) => x.id !== g.id));
    } else {
      setGastosFijos((prev) =>
        prev.map((x) => (x.id === g.id ? actualizado : x))
      );
    }
  }

  async function guardarEdicion(id: string, cambios: Partial<GastoFijo>) {
    const res = await fetch(`/api/gastos-fijos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    const data = await res.json();
    if (res.ok) {
      setGastosFijos((prev) =>
        prev.map((g) => (g.id === id ? data.gastoFijo : g))
      );
    }
    setEditandoId(null);
  }

  return (
    <div className="w-full max-w-md bg-ink-900 border border-paper-300/20 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-paper-300/50">
          Gastos fijos / mes
        </span>
        <span className="font-mono font-semibold text-lg text-led-amber tabular-nums">
          ${totalFijo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      {cargando && (
        <p className="text-center text-xs text-paper-300/40 py-2">Cargando...</p>
      )}

      {!cargando && gastosFijos.length === 0 && (
        <p className="text-center text-xs text-paper-300/40 py-2">
          Todavía no cargaste gastos fijos.
        </p>
      )}

      <ul className="flex flex-col divide-y divide-paper-300/10">
        {gastosFijos.map((g) =>
          editandoId === g.id ? (
            <FilaEdicion
              key={g.id}
              gastoFijo={g}
              onGuardar={(cambios) => guardarEdicion(g.id, cambios)}
              onCancelar={() => setEditandoId(null)}
            />
          ) : (
            <li
              key={g.id}
              className="print-line flex flex-col gap-1.5 py-2.5 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex-1 truncate text-paper-100">
                  {g.descripcion || g.categoria}
                </span>
                <span className="font-medium tabular-nums shrink-0 text-paper-100 text-right">
                  <span className="block">
                    $
                    {montoMensual(g).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  {g.cuotas_totales != null && (
                    <span className="block text-[10px] text-paper-300/40 font-normal">
                      de ${Number(g.monto).toLocaleString("es-AR")} total
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-paper-300/50 text-xs">
                  {g.cuotas_totales != null
                    ? `${g.cuotas_pagadas}/${g.cuotas_totales} cuotas · ${g.categoria}`
                    : g.categoria}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {g.cuotas_totales != null && (
                    <button
                      onClick={() => marcarCuotaPagada(g)}
                      aria-label="Marcar cuota pagada"
                      className="rounded-full text-paper-300/60 hover:text-led-green hover:bg-paper-300/10 text-xs px-2 py-1.5 -my-1.5"
                    >
                      +1 cuota
                    </button>
                  )}
                  <button
                    onClick={() => setEditandoId(g.id)}
                    aria-label="Editar gasto fijo"
                    className="rounded-full text-paper-300/60 hover:text-led-amber hover:bg-paper-300/10 text-sm px-2 py-1.5 -my-1.5"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => borrar(g.id)}
                    aria-label="Borrar gasto fijo"
                    className="rounded-full text-paper-300/60 hover:text-led-red hover:bg-paper-300/10 text-sm px-2 py-1.5 -my-1.5"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          )
        )}
      </ul>

      <form
        onSubmit={agregar}
        className="flex flex-col gap-2 pt-2 border-t border-paper-300/10"
      >
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder={esCuotas ? "Monto total de la compra" : "Monto"}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
            className="w-28 bg-ink-950 border border-paper-300/20 rounded-2xl px-3 py-2 text-sm text-paper-100"
          />
          <input
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="flex-1 bg-ink-950 border border-paper-300/20 rounded-2xl px-3 py-2 text-sm text-paper-100"
          />
        </div>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
          className="bg-ink-950 border border-paper-300/20 rounded-2xl px-3 py-2 text-sm text-paper-100"
        >
          <option value="">Categoría</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-xs text-paper-300/70">
          <input
            type="checkbox"
            checked={esCuotas}
            onChange={(e) => setEsCuotas(e.target.checked)}
          />
          Es en cuotas
        </label>

        {esCuotas && (
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-xs text-paper-300/50">
              Cantidad de cuotas
              <input
                type="number"
                min="1"
                value={cuotasTotales}
                onChange={(e) => setCuotasTotales(e.target.value)}
                required
                className="bg-ink-950 border border-paper-300/20 rounded-2xl px-3 py-2 text-sm text-paper-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-paper-300/50">
              Cuotas ya pagadas
              <input
                type="number"
                min="0"
                value={cuotasPagadas}
                onChange={(e) => setCuotasPagadas(e.target.value)}
                className="bg-ink-950 border border-paper-300/20 rounded-2xl px-3 py-2 text-sm text-paper-100"
              />
            </label>
          </div>
        )}

        {error && <p className="text-led-red text-xs">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="bg-paper-100 text-ink-950 rounded-full py-2 text-sm font-medium disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Agregar gasto fijo"}
        </button>
      </form>
    </div>
  );
}

function FilaEdicion({
  gastoFijo,
  onGuardar,
  onCancelar,
}: {
  gastoFijo: GastoFijo;
  onGuardar: (cambios: Partial<GastoFijo>) => void;
  onCancelar: () => void;
}) {
  const [monto, setMonto] = useState(String(gastoFijo.monto));
  const [descripcion, setDescripcion] = useState(gastoFijo.descripcion);
  const [categoria, setCategoria] = useState(gastoFijo.categoria);

  return (
    <li className="flex flex-col gap-2 py-2">
      {gastoFijo.cuotas_totales != null && (
        <p className="text-[10px] text-paper-300/40">
          El monto es el total de la compra (se divide por las {gastoFijo.cuotas_totales} cuotas)
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          className="w-24 bg-ink-950 border border-paper-300/20 rounded-2xl px-2 py-1 text-sm text-paper-100"
        />
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="flex-1 bg-ink-950 border border-paper-300/20 rounded-2xl px-2 py-1 text-sm text-paper-100"
        />
      </div>
      <div className="flex gap-2 items-center">
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="bg-ink-950 border border-paper-300/20 rounded-2xl px-2 py-1 text-sm text-paper-100"
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
            onGuardar({ monto: Number(monto), descripcion, categoria })
          }
          className="text-xs text-led-green"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="text-xs text-paper-300/50"
        >
          Cancelar
        </button>
      </div>
    </li>
  );
}
