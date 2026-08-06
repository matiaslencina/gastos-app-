"use client";

import { useState } from "react";
import type { Gasto } from "@/lib/supabase";

export default function TicketForm({
  onGastoAgregado,
}: {
  onGastoAgregado: (g: Gasto) => void;
}) {
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [ultimoAgregado, setUltimoAgregado] = useState<Gasto | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;

    setCargando(true);
    setError("");
    setUltimoAgregado(null);

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Algo salió mal");
      } else {
        onGastoAgregado(data.gasto);
        setUltimoAgregado(data.gasto);
        setTexto("");
      }
    } catch {
      setError("No se pudo conectar. Revisá tu conexión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder='"gasté 3500 en nafta ayer"'
          disabled={cargando}
          className="flex-1 bg-ink-900 border border-paper-300/20 rounded-full px-4 py-3 text-sm text-paper-100 placeholder:text-paper-300/30 focus:border-led-amber/60"
        />
        <button
          type="submit"
          disabled={cargando}
          className="bg-led-amber text-ink-950 rounded-full px-4 text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
        >
          {cargando ? "..." : "Cargar"}
        </button>
      </form>

      {error && <p className="text-led-red text-xs mt-2">{error}</p>}

      {ultimoAgregado && (
        <p className="print-line text-xs text-led-green mt-2 font-mono">
          ✓ {ultimoAgregado.categoria} · ${Number(ultimoAgregado.monto).toLocaleString("es-AR")} · {ultimoAgregado.descripcion}
        </p>
      )}
    </div>
  );
}
