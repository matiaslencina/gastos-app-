"use client";

import { useEffect, useMemo, useState } from "react";
import type { Gasto } from "@/lib/supabase";
import TicketForm from "./TicketForm";
import GastoForm from "./GastoForm";
import GastoList from "./GastoList";
import InsightsPanel from "./InsightsPanel";
import GastosFijosPanel from "./GastosFijosPanel";
import Nav from "./Nav";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default function Dashboard() {
  const hoy = new Date();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormManual, setMostrarFormManual] = useState(false);
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mostrarSelectorFecha, setMostrarSelectorFecha] = useState(false);

  const anioActual = hoy.getFullYear();
  const anios = [anioActual - 2, anioActual - 1, anioActual, anioActual + 1];

  async function cargarGastos() {
    const res = await fetch("/api/gastos");
    const data = await res.json();
    setGastos(data.gastos ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargarGastos();
  }, []);

  const gastosDelMes = useMemo(() => {
    return gastos.filter((g) => {
      const f = new Date(g.fecha + "T00:00:00");
      return f.getMonth() === mes && f.getFullYear() === anio;
    });
  }, [gastos, mes, anio]);

  const totalDelMes = useMemo(
    () => gastosDelMes.reduce((acc, g) => acc + Number(g.monto), 0),
    [gastosDelMes]
  );

  function agregarGastoLocal(gasto: Gasto) {
    setGastos((prev) => [gasto, ...prev]);
  }

  async function borrarGasto(id: string) {
    setGastos((prev) => prev.filter((g) => g.id !== id));
    await fetch(`/api/gastos/${id}`, { method: "DELETE" });
  }

  async function editarGasto(id: string, cambios: Partial<Gasto>) {
    const res = await fetch(`/api/gastos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    const data = await res.json();
    if (res.ok) {
      setGastos((prev) => prev.map((g) => (g.id === id ? data.gasto : g)));
    }
  }

  return (
    <main className="min-h-screen py-8 px-4 flex flex-col items-center gap-6">
      <Nav />

      <header className="w-full max-w-md">
        <h1 className="font-display font-bold text-2xl text-paper-100 tracking-tight">
          Mis Gastos
        </h1>
        <button
          type="button"
          onClick={() => setMostrarSelectorFecha((v) => !v)}
          className="text-xs text-paper-300/50 mt-0.5 bg-transparent p-0"
        >
          {MESES[mes]} de {anio}
        </button>

        {mostrarSelectorFecha && (
          <div className="flex gap-2 mt-1">
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="bg-transparent text-xs text-paper-300/70 border-none appearance-none focus:outline-none"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i} className="bg-ink-900 text-paper-100">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="bg-transparent text-xs text-paper-300/70 border-none appearance-none focus:outline-none"
            >
              {anios.map((a) => (
                <option key={a} value={a} className="bg-ink-900 text-paper-100">
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Display tipo caja registradora con el total del mes */}
      <div className="w-full max-w-md bg-ink-900 border border-led-amber/20 rounded-2xl px-5 py-4 flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-paper-300/50">
          Total del mes
        </span>
        <span className="font-mono font-semibold text-2xl text-led-amber tabular-nums">
          ${totalDelMes.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="w-full max-w-md flex flex-col gap-3">
        <h2 className="font-display font-semibold text-sm text-paper-100 tracking-tight">
          Gastos
        </h2>
        <TicketForm onGastoAgregado={agregarGastoLocal} />
      </div>

      <div className="w-full max-w-md">
        <button
          onClick={() => setMostrarFormManual((v) => !v)}
          className="text-xs text-paper-300/50 hover:text-paper-300/80 underline"
        >
          {mostrarFormManual ? "ocultar carga manual" : "cargar a mano en vez de texto"}
        </button>
        {mostrarFormManual && (
          <div className="mt-3">
            <GastoForm onGastoAgregado={agregarGastoLocal} />
          </div>
        )}
      </div>

      <InsightsPanel />

      <GastosFijosPanel />

      <GastoList
        gastos={gastosDelMes}
        cargando={cargando}
        onBorrar={borrarGasto}
        onEditar={editarGasto}
      />
    </main>
  );
}
