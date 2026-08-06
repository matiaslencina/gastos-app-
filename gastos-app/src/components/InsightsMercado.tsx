"use client";

import { useState } from "react";

export default function InsightsMercado() {
  const [resumen, setResumen] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function pedirResumen() {
    setCargando(true);
    setError("");
    setResumen("");

    try {
      const res = await fetch("/api/ai/mercado");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar el resumen");
      } else {
        setResumen(data.resumen);
      }
    } catch {
      setError("No se pudo conectar. Revisá tu conexión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <button
        onClick={pedirResumen}
        disabled={cargando}
        className="w-full border border-led-green/30 text-led-green rounded-full py-2.5 text-sm font-medium hover:bg-led-green/5 disabled:opacity-50"
      >
        {cargando ? "Pensando..." : "¿Cómo estuvo el mercado hoy?"}
      </button>

      {error && <p className="text-led-red text-xs mt-2">{error}</p>}

      {resumen && (
        <div className="print-line mt-3 bg-ink-900 border border-paper-300/20 rounded-2xl p-4 text-sm text-paper-200 whitespace-pre-line leading-relaxed">
          {resumen}
        </div>
      )}
    </div>
  );
}
