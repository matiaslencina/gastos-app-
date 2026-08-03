# Mis Gastos

App personal para anotar gastos, con carga por texto libre e insights usando Gemini.
Sin login: es solo para vos.

## Stack
- Next.js 14 (App Router) + Tailwind
- Supabase (Postgres) como base de datos
- Gemini API para parsear texto libre, categorizar y generar resúmenes
- Vercel para el deploy

---

## 1. Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo (plan gratis alcanza de sobra).
2. Una vez creado, ir a **SQL Editor** > **New query**, pegar el contenido de `supabase/schema.sql` (está en este zip) y darle **Run**. Esto crea la tabla `gastos`.
3. Ir a **Project Settings > API** y copiar dos valores:
   - **Project URL** → va en `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** (no la `anon` key) → va en `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ La `service_role key` tiene acceso total a la base sin restricciones. Nunca la pongas en código que corra en el navegador — en este proyecto solo se usa del lado del servidor (API routes), así que estás bien mientras no la muevas de ahí.

## 2. Gemini

1. Entrá a [aistudio.google.com/apikey](https://aistudio.google.com/apikey) con tu cuenta de Google y generá una API key. Es gratuita (tiene cuota gratis mensual) y es independiente de tu suscripción a Gemini Pro/Advanced — esa suscripción es para la app de chat, no para la API.
2. Copiá la key → va en `GEMINI_API_KEY`.

## 3. Configurar el proyecto local

Necesitás tener [Node.js](https://nodejs.org) instalado (versión 18 o más nueva).

```bash
# Descomprimir y entrar a la carpeta
cd gastos-app

# Instalar dependencias
npm install

# Copiar el archivo de variables de entorno y completarlo
cp .env.example .env.local
```

Abrí `.env.local` y completá las 3 variables con los valores de los pasos 1 y 2:

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

## 4. Correr local

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Deberías ver el "ticket" vacío. Probá escribir algo como:

> gasté 3500 en nafta ayer

y tocá "Cargar". Si aparece la línea verde con el gasto categorizado, todo está andando.

## 5. Deploy a Vercel

1. Subí la carpeta a un repo de GitHub (podés usar `git init`, `git add .`, `git commit`, y crear el repo desde GitHub o con `gh repo create`).
2. Entrá a [vercel.com](https://vercel.com), **Add New > Project**, elegí el repo.
3. En **Environment Variables**, agregá las mismas 3 variables que en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. **Deploy**. En 1-2 minutos tenés tu URL pública (algo como `gastos-app.vercel.app`).

Como no hay login, cualquiera que tenga esa URL puede ver y borrar tus gastos. Si te importa, dos opciones simples:
- En Vercel, activá **Deployment Protection** (Settings > Deployment Protection) con contraseña — gratis en el plan Hobby para el dominio de producción.
- O no compartas el link. Para uso 100% personal esto suele ser suficiente.

## Cómo está armado

- `src/app/api/gastos` — crear/listar gastos. Si no mandás categoría, la IA la sugiere.
- `src/app/api/ai/parse` — recibe un texto libre ("gasté 5000 en nafta") y devuelve un gasto ya guardado.
- `src/app/api/ai/insights` — junta los gastos del mes y le pide a Gemini un resumen.
- `src/lib/gemini.ts` — las 3 funciones de IA, con `gemini-flash-latest` para tareas simples y `gemini-pro-latest` para el resumen (son alias que Google va actualizando solo, no hace falta tocarlos cuando salga un modelo nuevo).
- `src/lib/supabase.ts` — cliente con la Service Role Key, usado solo en el servidor.

## Si querés agregar algo después

- **Filtrar por mes/categoría**: agregar query params al `GET /api/gastos` y un selector en el Dashboard.
- **Gráfico de gastos por categoría**: se puede agregar un chart (recharts) alimentado por los mismos datos que ya trae `Dashboard.tsx`.
- **Exportar a CSV/Excel**: un botón que pegue los `gastos` en un archivo y lo descargue.

Cualquiera de estas se puede pedir después mostrando este mismo proyecto.
