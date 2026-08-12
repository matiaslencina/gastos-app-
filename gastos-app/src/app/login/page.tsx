"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario }),
    });

    setCargando(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Usuario incorrecto");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-ink-900 border border-paper-300/20 rounded-2xl p-6 flex flex-col gap-4"
      >
        <h1 className="font-display text-xl text-paper-100 text-center">
          Mis Gastos
        </h1>

        <input
          autoFocus
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Usuario"
          className="w-full rounded-full bg-ink-950 border border-paper-300/20 px-4 py-2 text-sm text-paper-100 placeholder:text-paper-300/40 outline-none"
        />

        {error && <p className="text-sm text-led-red text-center">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-full bg-led-amber text-ink-950 font-medium py-2 text-sm disabled:opacity-50"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
