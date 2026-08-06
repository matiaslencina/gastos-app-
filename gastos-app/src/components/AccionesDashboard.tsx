"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MERCADOS, MERCADO_LABEL } from "@/lib/mercados";
import type { Mercado } from "@/lib/mercados";
import type { Posicion } from "@/lib/supabase";
import type { PosicionConPrecio } from "@/lib/posiciones";
import Nav from "./Nav";
import InsightsMercado from "./InsightsMercado";
import ChatMercado from "./ChatMercado";

type ResultadoBusqueda = {
  symbol: string;
  mercado: Mercado;
  precio: number | null;
  pctChange: number | null;
};

export default function AccionesDashboard() {
  const [posiciones, setPosiciones] = useState<PosicionConPrecio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [ticker, setTicker] = useState("");
  const [mercado, setMercado] = useState<Mercado>("cedear");
  const [cantidad, setCantidad] = useState("");
  const [ppc, setPpc] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargarPosiciones() {
    const res = await fetch("/api/posiciones");
    const data = await res.json();
    setPosiciones(data.posiciones ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargarPosiciones();
  }, []);

  const totalCartera = useMemo(
    () =>
      posiciones.reduce((acc, p) => acc + (p.valorActual ?? 0), 0),
    [posiciones]
  );

  const gananciaTotal = useMemo(
    () =>
      posiciones.some((p) => p.ganancia != null)
        ? posiciones.reduce((acc, p) => acc + (p.ganancia ?? 0), 0)
        : null,
    [posiciones]
  );

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    const res = await fetch("/api/posiciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker,
        mercado,
        cantidad: Number(cantidad),
        ppc: ppc || null,
      }),
    });
    const data = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setError(data.error ?? "Algo salió mal");
      return;
    }

    setTicker("");
    setMercado("cedear");
    setCantidad("");
    setPpc("");
    await cargarPosiciones();
  }

  async function borrar(id: string) {
    setPosiciones((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/posiciones/${id}`, { method: "DELETE" });
  }

  async function guardarEdicion(id: string, cambios: Partial<Posicion>) {
    const res = await fetch(`/api/posiciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar la edición");
      return;
    }

    setError("");
    setEditandoId(null);
    await cargarPosiciones();
  }

  return (
    <main className="min-h-screen py-8 px-4 flex flex-col items-center gap-6">
      <Nav />

      <header className="w-full max-w-md">
        <h1 className="font-display font-bold text-2xl text-paper-100 tracking-tight">
          Mis Acciones
        </h1>
        <p className="text-xs text-paper-300/50 mt-0.5">
          CEDEARs, bonos y acciones argentinas
        </p>
      </header>

      <div className="w-full max-w-md bg-ink-900 border border-led-amber/20 rounded-2xl px-5 py-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-paper-300/50">
            Total de la cartera
          </span>
          <span className="font-mono font-semibold text-2xl text-led-amber tabular-nums">
            ${totalCartera.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
        </div>
        {gananciaTotal != null && (
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-paper-300/50">
              Ganancia total
            </span>
            <span
              className={`font-mono font-semibold text-sm tabular-nums ${
                gananciaTotal > 0
                  ? "text-led-green"
                  : gananciaTotal < 0
                  ? "text-led-red"
                  : "text-paper-300/50"
              }`}
            >
              {gananciaTotal > 0 ? "+" : ""}
              ${gananciaTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      <div className="w-full max-w-md bg-ink-900 border border-paper-300/20 rounded-2xl p-4 flex flex-col gap-3">
        {cargando && (
          <p className="text-center text-xs text-paper-300/40 py-2">
            Cargando cotizaciones...
          </p>
        )}

        {!cargando && posiciones.length === 0 && (
          <p className="text-center text-xs text-paper-300/40 py-2">
            Todavía no cargaste ninguna posición.
          </p>
        )}

        <ul className="flex flex-col divide-y divide-paper-300/10">
          {posiciones.map((p) =>
            editandoId === p.id ? (
              <FilaEdicion
                key={p.id}
                posicion={p}
                onGuardar={(cambios) => guardarEdicion(p.id, cambios)}
                onCancelar={() => setEditandoId(null)}
              />
            ) : (
              <FilaPosicion
                key={p.id}
                posicion={p}
                onEditar={() => setEditandoId(p.id)}
                onBorrar={() => borrar(p.id)}
              />
            )
          )}
        </ul>

        <form
          onSubmit={agregar}
          className="flex flex-col gap-2 pt-2 border-t border-paper-300/10"
        >
          <div className="flex gap-2">
            <BuscadorTicker
              value={ticker}
              onChange={setTicker}
              onSeleccionar={(r) => {
                setTicker(r.symbol);
                setMercado(r.mercado);
              }}
            />
            <select
              value={mercado}
              onChange={(e) => setMercado(e.target.value as Mercado)}
              className="flex-1 bg-ink-950 border border-paper-300/20 rounded-2xl px-3 py-2 text-sm text-paper-100"
            >
              {MERCADOS.map((m) => (
                <option key={m} value={m}>
                  {MERCADO_LABEL[m]}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.0001"
              min="0"
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
              className="w-28 bg-ink-950 border border-paper-300/20 rounded-2xl px-3 py-2 text-sm text-paper-100"
            />
          </div>

          <input
            type="number"
            step="0.0001"
            min="0"
            placeholder="Precio de compra (opcional, para ver ganancia)"
            value={ppc}
            onChange={(e) => setPpc(e.target.value)}
            className="bg-ink-950 border border-paper-300/20 rounded-2xl px-3 py-2 text-sm text-paper-100"
          />
          {(mercado === "bono" || mercado === "lecap") && (
            <p className="text-[10px] text-paper-300/40">
              Para bonos/LECAPs, poné el precio por cada 100 de VN (como lo
              mostraría tu broker), no el precio unitario.
            </p>
          )}

          {error && <p className="text-led-red text-xs">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="bg-paper-100 text-ink-950 rounded-full py-2 text-sm font-medium disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Agregar posición"}
          </button>
        </form>
      </div>

      <InsightsMercado />

      <ChatMercado />
    </main>
  );
}

function BuscadorTicker({
  value,
  onChange,
  onSeleccionar,
}: {
  value: string;
  onChange: (v: string) => void;
  onSeleccionar: (r: ResultadoBusqueda) => void;
}) {
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [abierto, setAbierto] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (!value.trim()) {
      setResultados([]);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      fetch(`/api/cotizaciones/buscar?q=${encodeURIComponent(value)}`)
        .then((res) => res.json())
        .then((data) => setResultados(data.resultados ?? []))
        .catch(() => setResultados([]));
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [value]);

  return (
    <div className="relative w-28">
      <input
        placeholder="Ticker (ej. CAT)"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        required
        className="w-full bg-ink-950 border border-paper-300/20 rounded-2xl px-3 py-2 text-sm text-paper-100"
      />
      {abierto && resultados.length > 0 && (
        <ul className="absolute z-10 left-0 mt-1 w-64 max-h-56 overflow-y-auto overflow-x-hidden bg-ink-950 border border-paper-300/20 rounded-2xl shadow-lg">
          {resultados.map((r) => (
            <li key={`${r.mercado}-${r.symbol}`}>
              <button
                type="button"
                onClick={() => {
                  onSeleccionar(r);
                  setAbierto(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left text-paper-100 hover:bg-ink-900"
              >
                <span>
                  {r.symbol}
                  <span className="text-paper-300/40 text-xs ml-1.5">
                    {MERCADO_LABEL[r.mercado]}
                  </span>
                </span>
                <span
                  className={`text-xs tabular-nums shrink-0 ${
                    (r.pctChange ?? 0) > 0
                      ? "text-led-green"
                      : (r.pctChange ?? 0) < 0
                      ? "text-led-red"
                      : "text-paper-300/50"
                  }`}
                >
                  {r.precio != null
                    ? `$${r.precio.toLocaleString("es-AR")}`
                    : "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilaPosicion({
  posicion: p,
  onEditar,
  onBorrar,
}: {
  posicion: PosicionConPrecio;
  onEditar: () => void;
  onBorrar: () => void;
}) {
  const subio = (p.pctChange ?? 0) > 0;
  const bajo = (p.pctChange ?? 0) < 0;

  return (
    <li className="print-line flex flex-col gap-1.5 py-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 truncate text-paper-100 font-medium">
          {p.ticker}
        </span>
        <span className="font-medium tabular-nums shrink-0 text-paper-100 text-right">
          {p.valorActual != null
            ? `$${p.valorActual.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}`
            : "—"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-paper-300/50 text-xs">
          {MERCADO_LABEL[p.mercado]} · {p.cantidad} u.
          {p.pctChange != null && (
            <span
              className={`ml-1.5 ${
                subio ? "text-led-green" : bajo ? "text-led-red" : "text-paper-300/50"
              }`}
            >
              {subio ? "▲" : bajo ? "▼" : "—"} {Math.abs(p.pctChange).toFixed(2)}% hoy
            </span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEditar}
            aria-label="Editar posición"
            className="rounded-full text-paper-300/60 hover:text-led-amber hover:bg-paper-300/10 text-sm px-2 py-1.5 -my-1.5"
          >
            ✎
          </button>
          <button
            onClick={onBorrar}
            aria-label="Borrar posición"
            className="rounded-full text-paper-300/60 hover:text-led-red hover:bg-paper-300/10 text-sm px-2 py-1.5 -my-1.5"
          >
            ✕
          </button>
        </div>
      </div>

      {p.ganancia != null && p.gananciaPorc != null && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-paper-300/50 text-xs">PPC ${p.ppc}</span>
          <span
            className={`text-xs font-medium tabular-nums ${
              p.ganancia > 0
                ? "text-led-green"
                : p.ganancia < 0
                ? "text-led-red"
                : "text-paper-300/50"
            }`}
          >
            {p.ganancia > 0 ? "+" : ""}
            ${p.ganancia.toLocaleString("es-AR", { minimumFractionDigits: 2 })} (
            {p.gananciaPorc > 0 ? "+" : ""}
            {p.gananciaPorc.toFixed(2)}%)
          </span>
        </div>
      )}
    </li>
  );
}

function FilaEdicion({
  posicion,
  onGuardar,
  onCancelar,
}: {
  posicion: Posicion;
  onGuardar: (cambios: Partial<Posicion>) => void;
  onCancelar: () => void;
}) {
  const [ticker, setTicker] = useState(posicion.ticker);
  const [mercado, setMercado] = useState<Mercado>(posicion.mercado);
  const [cantidad, setCantidad] = useState(String(posicion.cantidad));
  const [ppc, setPpc] = useState(posicion.ppc != null ? String(posicion.ppc) : "");

  return (
    <li className="flex flex-col gap-2 py-2">
      <div className="flex gap-2 items-center">
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="w-24 bg-ink-950 border border-paper-300/20 rounded-2xl px-2 py-1 text-sm text-paper-100"
        />
        <select
          value={mercado}
          onChange={(e) => setMercado(e.target.value as Mercado)}
          className="flex-1 bg-ink-950 border border-paper-300/20 rounded-2xl px-2 py-1 text-sm text-paper-100"
        >
          {MERCADOS.map((m) => (
            <option key={m} value={m}>
              {MERCADO_LABEL[m]}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.0001"
          min="0"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-24 bg-ink-950 border border-paper-300/20 rounded-2xl px-2 py-1 text-sm text-paper-100"
        />
      </div>
      <input
        type="number"
        step="0.0001"
        min="0"
        placeholder="PPC (precio de compra)"
        value={ppc}
        onChange={(e) => setPpc(e.target.value)}
        className="bg-ink-950 border border-paper-300/20 rounded-2xl px-2 py-1 text-sm text-paper-100"
      />
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() =>
            onGuardar({
              ticker,
              mercado,
              cantidad: Number(cantidad),
              ppc: ppc ? Number(ppc) : null,
            })
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
