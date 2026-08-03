import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generarInsights } from "@/lib/gemini";

export async function GET() {
  const desde = new Date();
  desde.setDate(1); // primer día del mes actual

  const { data, error } = await supabaseAdmin
    .from("gastos")
    .select("*")
    .gte("fecha", desde.toISOString().slice(0, 10))
    .order("fecha", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const resumen = await generarInsights(data ?? []);
    return NextResponse.json({ resumen });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No pude generar el resumen con IA en este momento." },
      { status: 500 }
    );
  }
}
