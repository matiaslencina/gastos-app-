-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y correr

create extension if not exists "pgcrypto";

create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  monto numeric(12, 2) not null check (monto > 0),
  descripcion text not null default '',
  categoria text not null default 'Otros',
  fecha date not null default current_date,
  origen text not null default 'manual', -- 'manual' | 'ia'
  created_at timestamptz not null default now()
);

create index if not exists gastos_fecha_idx on gastos (fecha desc);

-- La app usa la Service Role Key desde el servidor (nunca desde el navegador),
-- así que RLS queda deshabilitado: es más simple para un proyecto de un solo usuario
-- y no hay riesgo porque la key nunca se expone al cliente.
alter table gastos disable row level security;

-- Gastos fijos: lista aparte de gastos recurrentes mensuales (alquiler, streaming,
-- etc.). No genera filas en "gastos" ni afecta el total del mes.
create table if not exists gastos_fijos (
  id uuid primary key default gen_random_uuid(),
  monto numeric(12, 2) not null check (monto > 0),
  descripcion text not null default '',
  categoria text not null default 'Otros',
  cuotas_totales integer check (cuotas_totales > 0),
  cuotas_pagadas integer not null default 0 check (cuotas_pagadas >= 0),
  created_at timestamptz not null default now()
);

alter table gastos_fijos disable row level security;

-- Migración para bases que ya tenían gastos_fijos sin columnas de cuotas:
alter table gastos_fijos add column if not exists cuotas_totales integer check (cuotas_totales > 0);
alter table gastos_fijos add column if not exists cuotas_pagadas integer not null default 0 check (cuotas_pagadas >= 0);

-- Cartera de acciones/CEDEARs/bonos. El precio y la variación del día se
-- consultan en vivo (data912.com), aquí solo se guarda lo que el usuario tiene.
create table if not exists posiciones (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  nombre text not null,
  mercado text not null default 'cedear', -- 'cedear' | 'bono' | 'lecap' | 'accion'
  cantidad numeric(14, 4) not null check (cantidad > 0),
  ppc numeric(14, 4) check (ppc > 0), -- precio promedio de compra, misma convención que el precio de mercado (bonos/LECAPs por cada 100 nominal)
  created_at timestamptz not null default now()
);

alter table posiciones disable row level security;

-- Migración para bases que ya tenían posiciones sin ppc:
alter table posiciones add column if not exists ppc numeric(14, 4) check (ppc > 0);
