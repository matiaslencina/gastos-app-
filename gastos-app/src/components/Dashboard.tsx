"use client";

import { useEffect, useMemo, useState } from "react";
import type { Gasto } from "@/lib/supabase";
import TicketForm from "./TicketForm";
import GastoForm from "./GastoForm";
import GastoList from "./GastoList";
import InsightsPanel from "./InsightsPanel";
import GastosFijosPanel from "./GastosFijosPanel";
import Nav from "./Nav";

export default function Dashboard() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormManual, setMostrarFormManual] = useState(false);

  async function cargarGastos() {
    const res = await fetch("/api/gastos");
    const data = await res.json();
    setGastos(data.gastos ?? []);
    setCargando(false);
  }

  useEffect(() => {
    cargarGastos();
  }, []);

  const totalDelMes = useMemo(() => {
    const hoy = new Date();
    return gastos
      .filter((g) => {
        const f = new Date(g.fecha + "T00:00:00");
        return (
          f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
        );
      })
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastos]);

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
        <p className="text-xs text-paper-300/50 mt-0.5">
          {new Date().toLocaleDateString("es-AR", {
            month: "long",
            year: "numeric",
          })}
        </p>
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
        gastos={gastos}
        cargando={cargando}
        onBorrar={borrarGasto}
        onEditar={editarGasto}
      />
    </main>
  );
}
