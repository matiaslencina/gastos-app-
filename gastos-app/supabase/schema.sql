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
