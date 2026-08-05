import { GoogleGenAI } from "@google/genai";
import { CATEGORIAS } from "./categorias";
import type { Gasto } from "./supabase";
import type { PosicionConPrecio } from "./posiciones";
import type { CotizacionData912 } from "./data912";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Modelo rápido y barato para tareas simples (parseo, categorización).
const MODEL_FLASH = "gemini-flash-latest";
// Modelo más potente para razonar sobre varios gastos y dar insights.
const MODEL_PRO = "gemini-flash-latest";

const CATEGORIAS_VALIDAS: readonly string[] = CATEGORIAS;

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// BYMA opera de lunes a viernes de 11:00 a 17:00, hora Argentina (UTC-3 fijo,
// no tiene horario de verano). Esto le permite a la IA saber si tiene que
// hablar de "cómo viene" el día o de "cómo cerró".
function estadoMercadoArgentino(): string {
  const horaAR = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const dia = horaAR.getUTCDay();
  const horas = horaAR.getUTCHours();
  const minutos = horaAR.getUTCMinutes();
  const horaDecimal = horas + minutos / 60;
  const horaTexto = `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

  if (dia === 0 || dia === 6) {
    return `Son las ${horaTexto} (hora Argentina) de un día de fin de semana: el mercado está cerrado. Las variaciones que te paso son las del último cierre (viernes), no de "hoy".`;
  }
  if (horaDecimal < 11) {
    return `Son las ${horaTexto} (hora Argentina) y el mercado TODAVÍA NO ABRIÓ hoy (abre 11:00). Las variaciones que te paso son las del cierre de la rueda anterior, no de la sesión de hoy.`;
  }
  if (horaDecimal < 17) {
    return `Son las ${horaTexto} (hora Argentina): el mercado está ABIERTO ahora mismo (cierra 17:00). Las variaciones que te paso son en vivo, de lo que va de la rueda de hoy hasta este momento, no un cierre.`;
  }
  return `Son las ${horaTexto} (hora Argentina): el mercado YA CERRÓ por hoy (cerró 17:00). Las variaciones que te paso son las del cierre de la rueda de hoy.`;
}

export type GastoParseado = {
  monto: number;
  descripcion: string;
  categoria: string;
  fecha: string;
};

/**
 * Convierte un texto libre como "gasté 5000 en nafta ayer" en un gasto
 * estructurado, usando salida JSON forzada por schema.
 */
export async function parseGastoDesdeTexto(
  texto: string
): Promise<GastoParseado> {
  const hoy = hoyISO();

  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Hoy es ${hoy}. Extraé un gasto en pesos argentinos a partir de este texto: "${texto}".
Reglas:
- "monto" es un número positivo (sin signo $ ni puntos de miles).
- "categoria" tiene que ser EXACTAMENTE una de: ${CATEGORIAS.join(", ")}.
- "fecha" en formato YYYY-MM-DD. Si el texto dice "ayer", "hoy", "el lunes", etc, calculala en base a hoy=${hoy}. Si no hay ninguna referencia temporal, usá ${hoy}.
- "descripcion" es un resumen corto (2-5 palabras) de en qué se gastó.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          monto: { type: "number" },
          descripcion: { type: "string" },
          categoria: { type: "string", enum: [...CATEGORIAS] },
          fecha: { type: "string" },
        },
        required: ["monto", "descripcion", "categoria", "fecha"],
      },
      temperature: 0.1,
    },
  });

  const parsed = JSON.parse(response.text ?? "{}");

  return {
    monto: Number(parsed.monto) || 0,
    descripcion: String(parsed.descripcion ?? "").slice(0, 200),
    categoria: CATEGORIAS_VALIDAS.includes(parsed.categoria) ? parsed.categoria : "Otros",
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(parsed.fecha) ? parsed.fecha : hoy,
  };
}

/**
 * Sugiere una categoría para un gasto a partir de su descripción.
 */
export async function categorizarGasto(descripcion: string): Promise<string> {
  if (!descripcion.trim()) return "Otros";

  const response = await ai.models.generateContent({
    model: MODEL_FLASH,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Categorizá este gasto: "${descripcion}". Elegí una sola categoría de esta lista: ${CATEGORIAS.join(", ")}.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          categoria: { type: "string", enum: [...CATEGORIAS] },
        },
        required: ["categoria"],
      },
      temperature: 0,
    },
  });

  const parsed = JSON.parse(response.text ?? "{}");
  return CATEGORIAS_VALIDAS.includes(parsed.categoria) ? parsed.categoria : "Otros";
}

/**
 * Genera un resumen/insights en texto natural a partir de una lista de gastos.
 */
export async function generarInsights(gastos: Gasto[]): Promise<string> {
  if (gastos.length === 0) {
    return "Todavía no registraste gastos. Agregá algunos y volvé a pedir el resumen.";
  }

  const resumen = gastos.map((g) => ({
    monto: g.monto,
    categoria: g.categoria,
    fecha: g.fecha,
    descripcion: g.descripcion,
  }));

  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Sos un asistente financiero personal para alguien en Argentina. Te paso sus gastos recientes en JSON.
Escribí un resumen breve (máximo 6 líneas, en español rioplatense, tono directo y cercano, sin emojis de más) que incluya:
1. En qué categoría gastó más.
2. Algún patrón o gasto llamativo si lo hay.
3. Una sugerencia concreta y práctica para el próximo mes.

Gastos:
${JSON.stringify(resumen)}`,
          },
        ],
      },
    ],
    config: { temperature: 0.4 },
  });

  return response.text ?? "No pude generar el resumen, probá de nuevo.";
}

/**
 * Genera un resumen del mercado del día combinando las posiciones del
 * usuario con el contexto general del panel de CEDEARs (mayores subas/bajas).
 */
export async function generarResumenMercado(
  posiciones: PosicionConPrecio[],
  topSubas: CotizacionData912[],
  topBajas: CotizacionData912[]
): Promise<string> {
  if (posiciones.length === 0) {
    return "Todavía no cargaste ninguna posición. Agregá alguna y volvé a pedir el resumen.";
  }

  const resumenPosiciones = posiciones.map((p) => ({
    ticker: p.ticker,
    nombre: p.nombre,
    mercado: p.mercado,
    variacionHoyPorc: p.pctChange,
    valorActual: p.valorActual,
  }));

  const estadoMercado = estadoMercadoArgentino();

  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Sos un asistente financiero personal para alguien que invierte en la bolsa argentina (CEDEARs y bonos). Te paso sus posiciones actuales y el contexto general del mercado, todo en JSON.

Estado del mercado en este momento: ${estadoMercado}

Escribí un resumen breve (máximo 10 líneas, en español rioplatense, tono directo y cercano, sin emojis de más) que incluya:
1. Según el estado del mercado de arriba, dejá claro si esto es "cómo va hasta ahora" (mercado abierto o recién abierto), "cómo cerró" (mercado ya cerrado), o que todavía no hay novedades de hoy (no abrió o es fin de semana, y las variaciones son del cierre anterior).
2. Cómo les fue a sus posiciones (cuáles subieron/bajaron más).
3. Contexto general: qué se destacó en el mercado (mayores subas/bajas del panel).
4. Una recomendación concreta y práctica (aclarando que es una opinión, no un consejo financiero formal).

Sus posiciones:
${JSON.stringify(resumenPosiciones)}

Mayores subas del panel de CEDEARs hoy:
${JSON.stringify(topSubas)}

Mayores bajas del panel de CEDEARs hoy:
${JSON.stringify(topBajas)}`,
          },
        ],
      },
    ],
    config: { temperature: 0.4 },
  });

  return response.text ?? "No pude generar el resumen del mercado, probá de nuevo.";
}
