"use client";

import { useState } from "react";

type Mensaje = {
  role: "user" | "model";
  texto: string;
};

export default function ChatMercado() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const preguntaActual = pregunta.trim();
    if (!preguntaActual) return;

    const historial = mensajes;
    setMensajes((prev) => [...prev, { role: "user", texto: preguntaActual }]);
    setPregunta("");
    setCargando(true);
    setError("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: preguntaActual, historial }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No pude responder eso");
        return;
      }

      setMensajes((prev) => [...prev, { role: "model", texto: data.respuesta }]);
    } catch {
      setError("No se pudo conectar. Revisá tu conexión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-ink-900 border border-paper-300/20 rounded-2xl p-4 flex flex-col gap-3">
      <span className="text-xs uppercase tracking-widest text-paper-300/50">
        Preguntale a la IA
      </span>

      {mensajes.length === 0 && (
        <p className="text-xs text-paper-300/40 py-1">
          Preguntá lo que quieras sobre tu cartera, un activo, o el mercado en
          general.
        </p>
      )}

      {mensajes.length > 0 && (
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {mensajes.map((m, i) => (
            <div
              key={i}
              className={`print-line max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line leading-relaxed ${
                m.role === "user"
                  ? "self-end bg-paper-100 text-ink-950"
                  : "self-start bg-ink-950 border border-paper-300/20 text-paper-200"
              }`}
            >
              {m.texto}
            </div>
          ))}
        </div>
      )}

      {cargando && (
        <p className="text-xs text-paper-300/40">Pensando...</p>
      )}
      {error && <p className="text-led-red text-xs">{error}</p>}

      <form onSubmit={enviar} className="flex gap-2">
        <input
          placeholder="Ej: ¿me conviene promediar AMD?"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          className="flex-1 bg-ink-950 border border-paper-300/20 rounded-full px-4 py-2 text-sm text-paper-100"
        />
        <button
          type="submit"
          disabled={cargando || !pregunta.trim()}
          className="bg-led-green text-ink-950 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
