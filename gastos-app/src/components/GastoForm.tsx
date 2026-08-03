"use client";

import { useState } from "react";
import { CATEGORIAS } from "@/lib/categorias";
import type { Gasto } from "@/lib/supabase";

export default function GastoForm({
  onGastoAgregado,
}: {
  onGastoAgregado: (g: Gasto) => void;
}) {
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");

    const res = await fetch("/api/gastos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monto: Number(monto), descripcion, categoria, fecha }),
    });
    const data = await res.json();

    setCargando(false);

    if (!res.ok) {
      setError(data.error ?? "Algo salió mal");
      return;
    }

    onGastoAgregado(data.gasto);
    setMonto("");
    setDescripcion("");
    setCategoria("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-ink-900 border border-paper-300/20 rounded-sm p-4 flex flex-col gap-3"
    >
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
          className="w-28 bg-ink-950 border border-paper-300/20 rounded-sm px-3 py-2 text-sm text-paper-100"
        />
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="bg-ink-950 border border-paper-300/20 rounded-sm px-3 py-2 text-sm text-paper-100"
        />
      </div>
      <input
        placeholder="Descripción (opcional)"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        className="bg-ink-950 border border-paper-300/20 rounded-sm px-3 py-2 text-sm text-paper-100"
      />
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="bg-ink-950 border border-paper-300/20 rounded-sm px-3 py-2 text-sm text-paper-100"
      >
        <option value="">Categoría (la IA la sugiere si la dejás vacía)</option>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {error && <p className="text-led-red text-xs">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="bg-paper-100 text-ink-950 rounded-sm py-2 text-sm font-medium disabled:opacity-50"
      >
        {cargando ? "Guardando..." : "Guardar gasto"}
      </button>
    </form>
  );
}
