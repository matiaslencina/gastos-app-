import { createClient } from "@supabase/supabase-js";

// OJO: esto usa la Service Role Key. Solo se importa desde código
// que corre en el servidor (API routes), nunca desde componentes de cliente.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export type Gasto = {
  id: string;
  monto: number;
  descripcion: string;
  categoria: string;
  fecha: string; // YYYY-MM-DD
  origen: "manual" | "ia";
  created_at: string;
};
