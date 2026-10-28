-- ============================================================
-- Plataforma JF — Migração 0001: enums, tabelas e índices
-- Referência: documento "Backlog do MVP e Schema do Banco"
-- ============================================================

create extension if not exists vector;

-- Enums -------------------------------------------------------
create type org_type            as enum ('construtora', 'imobiliaria');
create type user_role           as enum ('platform_admin', 'org_admin', 'manager', 'broker');
create type development_status  as enum ('rascunho', 'lancamento', 'em_obras', 'pronto', 'arquivado');
create type unit_status         as enum ('disponivel', 'reservada', 'vendida', 'bloqueada');
create type price_table_status  as enum ('rascunho', 'em_conferencia', 'publicada', 'arquivada');
create type material_type       as enum ('book', 'planta', 'tabela_pdf', 'video', 'tour_virtual', 'imagem', 'outro');
create type partnership_status  as enum ('pendente', 'ativa', 'suspensa', 'encerrada');
create type reservation_status  as enum ('pendente', 'ativa', 'expirada', 'cancelada', 'convertida');
create type lead_status         as enum ('ativo', 'em_negociacao', 'convertido', 'perdido', 'expirado');

-- updated_at automático --------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 1. Organizações ---------------------------------------------
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  type        org_type not null,
  name        text not null,
  cnpj        text unique,
  logo_url    text,
  city        text,
  state       text default 'SC',
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_org_updated before update on organizations
  for each row execute function set_updated_at();

-- 2. Perfis (estende auth.users) ------------------------------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references organizations(id),
  role        user_role not null default 'broker',
  full_name   text not null,
  avatar_url  text,
  phone       text,
  creci       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_profiles_org on profiles(org_id);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- 3. Parcerias construtora <-> imobiliária --------------------
create table partnerships (
  id              uuid primary key default gen_random_uuid(),
  construtora_id  uuid not null references organizations(id),
  imobiliaria_id  uuid not null references organizations(id),
  status          partnership_status not null default 'pendente',
  commission_pct  numeric(5,2),
  notes           text,
  requested_by    uuid references profiles(id),
  decided_by      uuid references profiles(id),
  decided_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (construtora_id, imobiliaria_id)
);
create trigger trg_partnerships_updated before update on partnerships
  for each row execute function set_updated_at();

-- 4. Empreendimentos ------------------------------------------
create table developments (
  id              uuid primary key default gen_random_uuid(),
  construtora_id  uuid not null references organizations(id),
  name            text not null,
  slug            text not null unique,
  status          development_status not null default 'rascunho',
  is_open_to_all  boolean not null default false,
  description     text,
  address         text,
  neighborhood    text,
  city            text not null,
  lat             double precision,
  lng             double precision,
  delivery_date   date,
  amenities       jsonb not null default '[]',
  cover_url       text,
  gallery         jsonb not null default '[]',
  min_price_cache numeric(14,2),
  embedding       vector(1024),
  published_at    timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_dev_construtora on developments(construtora_id);
create index idx_dev_city_status on developments(city, status);
create trigger trg_dev_updated before update on developments
  for each row execute function set_updated_at();

-- 5. Torres ----------------------------------------------------
create table towers (
  id              uuid primary key default gen_random_uuid(),
  development_id  uuid not null references developments(id) on delete cascade,
  name            text not null,
  floors          int,
  units_per_floor int,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (development_id, name)
);
create trigger trg_towers_updated before update on towers
  for each row execute function set_updated_at();

-- 6. Unidades ---------------------------------------------------
create table units (
  id                uuid primary key default gen_random_uuid(),
  development_id    uuid not null references developments(id) on delete cascade,
  tower_id          uuid not null references towers(id) on delete cascade,
  unit_number       text not null,
  floor             int,
  column_ref        text,
  typology          text,
  bedrooms          int,
  suites            int,
  bathrooms         int,
  parking_spots     int,
  private_area      numeric(8,2),
  total_area        numeric(8,2),
  sun_position      text,
  status            unit_status not null default 'disponivel',
  status_changed_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (tower_id, unit_number)
);
create index idx_units_dev_status on units(development_id, status);
create trigger trg_units_updated before update on units
  for each row execute function set_updated_at();

-- 6b. Auditoria do espelho --------------------------------------
create table unit_status_history (
  id          uuid primary key default gen_random_uuid(),
  unit_id     uuid not null references units(id) on delete cascade,
  from_status unit_status,
  to_status   unit_status not null,
  changed_by  uuid references profiles(id),
  reason      text,
  created_at  timestamptz not null default now()
);
create index idx_ush_unit on unit_status_history(unit_id, created_at desc);

-- Grava histórico automaticamente a cada mudança de status
create or replace function public.log_unit_status()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
    insert into unit_status_history (unit_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger trg_units_status before update on units
  for each row execute function log_unit_status();

-- 7. Tabelas de vendas ------------------------------------------
create table price_tables (
  id              uuid primary key default gen_random_uuid(),
  development_id  uuid not null references developments(id) on delete cascade,
  version         int not null,
  status          price_table_status not null default 'rascunho',
  source_file_url text,
  ai_extraction   jsonb,
  valid_from      date,
  valid_until     date,
  general_terms   jsonb,
  notes           text,
  created_by      uuid references profiles(id),
  published_by    uuid references profiles(id),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (development_id, version)
);
create unique index uq_price_table_published
  on price_tables(development_id) where status = 'publicada';
create trigger trg_pt_updated before update on price_tables
  for each row execute function set_updated_at();

-- 8. Itens da tabela ---------------------------------------------
create table price_table_items (
  id              uuid primary key default gen_random_uuid(),
  price_table_id  uuid not null references price_tables(id) on delete cascade,
  unit_id         uuid not null references units(id) on delete cascade,
  price           numeric(14,2) not null,
  payment_terms   jsonb,
  ai_confidence   numeric(3,2),
  was_edited      boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (price_table_id, unit_id)
);
create index idx_pti_unit on price_table_items(unit_id);

-- 9. Materiais -----------------------------------------------------
create table materials (
  id              uuid primary key default gen_random_uuid(),
  development_id  uuid not null references developments(id) on delete cascade,
  type            material_type not null,
  title           text not null,
  file_url        text,
  external_url    text,
  file_size_bytes bigint,
  version         int not null default 1,
  replaces_id     uuid references materials(id),
  is_public       boolean not null default false,
  is_active       boolean not null default true,
  uploaded_by     uuid references profiles(id),
  created_at      timestamptz not null default now()
);
create index idx_materials_dev on materials(development_id) where is_active;

-- 10. Reservas -----------------------------------------------------
create table reservations (
  id              uuid primary key default gen_random_uuid(),
  unit_id         uuid not null references units(id),
  broker_id       uuid not null references profiles(id),
  imobiliaria_id  uuid not null references organizations(id),
  status          reservation_status not null default 'pendente',
  client_label    text,
  lead_id         uuid,
  expires_at      timestamptz not null,
  decided_by      uuid references profiles(id),
  decided_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index uq_reservation_active
  on reservations(unit_id) where status in ('pendente','ativa');
create index idx_res_broker on reservations(broker_id, status);
create trigger trg_res_updated before update on reservations
  for each row execute function set_updated_at();

-- 11. Leads --------------------------------------------------------
create table leads (
  id                uuid primary key default gen_random_uuid(),
  development_id    uuid not null references developments(id),
  broker_id         uuid not null references profiles(id),
  imobiliaria_id    uuid not null references organizations(id),
  client_name       text not null,
  client_phone      text not null,      -- criptografar na aplicação (LGPD)
  client_phone_hash text not null,      -- sha256 do fone normalizado
  status            lead_status not null default 'ativo',
  protection_until  date,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_leads_dedup on leads(development_id, client_phone_hash);
create index idx_leads_broker on leads(broker_id, status);
create trigger trg_leads_updated before update on leads
  for each row execute function set_updated_at();

alter table reservations
  add constraint fk_res_lead foreign key (lead_id) references leads(id);

-- 12. Notificações ---------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  payload     jsonb not null default '{}',
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_notif_user on notifications(user_id, created_at desc)
  where read_at is null;

-- Realtime: espelho de vendas e publicações de tabela ---------------
alter publication supabase_realtime add table units;
alter publication supabase_realtime add table price_tables;
