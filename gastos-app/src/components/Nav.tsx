"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/", label: "Gastos" },
  { href: "/acciones", label: "Acciones" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="w-full max-w-md flex gap-2">
      {TABS.map((tab) => {
        const activo = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 text-center rounded-full py-2 text-sm font-medium border transition-colors ${
              activo
                ? "bg-led-amber text-ink-950 border-led-amber"
                : "bg-ink-900 text-paper-300/60 border-paper-300/20"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <button
        onClick={handleLogout}
        className="rounded-full py-2 px-4 text-sm font-medium border bg-ink-900 text-paper-300/60 border-paper-300/20"
      >
        Salir
      </button>
    </nav>
  );
}
