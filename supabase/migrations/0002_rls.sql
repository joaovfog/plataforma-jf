-- ============================================================
-- Plataforma JF — Migração 0002: Row Level Security
-- Regra de ouro: NENHUMA tabela sem RLS. O isolamento entre
-- organizações é o contrato de confiança da plataforma.
-- ============================================================

-- Helpers ------------------------------------------------------
create or replace function public.current_org()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.is_org_manager()
returns boolean language sql stable as $$
  select public.current_role() in ('org_admin', 'manager', 'platform_admin');
$$;

-- Corretor tem acesso ao empreendimento? (parceria ativa ou aberto a todos)
create or replace function public.can_view_development(dev_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from developments d
    where d.id = dev_id
      and d.deleted_at is null
      and (
        d.construtora_id = public.current_org()                -- dona
        or (
          d.status <> 'rascunho'
          and (
            d.is_open_to_all
            or exists (
              select 1 from partnerships p
              where p.construtora_id = d.construtora_id
                and p.imobiliaria_id = public.current_org()
                and p.status = 'ativa'
            )
          )
        )
      )
  );
$$;

-- Ativar RLS em tudo -------------------------------------------
alter table organizations       enable row level security;
alter table profiles            enable row level security;
alter table partnerships        enable row level security;
alter table developments        enable row level security;
alter table towers              enable row level security;
alter table units               enable row level security;
alter table unit_status_history enable row level security;
alter table price_tables        enable row level security;
alter table price_table_items   enable row level security;
alter table materials           enable row level security;
alter table reservations        enable row level security;
alter table leads               enable row level security;
alter table notifications       enable row level security;

-- organizations -------------------------------------------------
create policy org_select on organizations for select
  to authenticated -- nunca para anon: lista de orgs só com login
  using (id = public.current_org() or is_active); -- nome/logo visíveis p/ busca de parceria
create policy org_update on organizations for update
  using (id = public.current_org() and public.is_org_manager());

-- profiles --------------------------------------------------------
create policy profiles_select on profiles for select
  using (org_id = public.current_org() or id = auth.uid());
create policy profiles_update_self on profiles for update
  using (id = auth.uid());
create policy profiles_manage on profiles for update
  using (org_id = public.current_org() and public.is_org_manager());

-- partnerships ----------------------------------------------------
create policy partnerships_select on partnerships for select
  using (construtora_id = public.current_org() or imobiliaria_id = public.current_org());
create policy partnerships_insert on partnerships for insert
  with check (imobiliaria_id = public.current_org() and public.is_org_manager());
create policy partnerships_decide on partnerships for update
  using (construtora_id = public.current_org() and public.is_org_manager());

-- developments ------------------------------------------------------
create policy dev_select on developments for select
  using (public.can_view_development(id));
create policy dev_write on developments for all
  using (construtora_id = public.current_org() and public.is_org_manager())
  with check (construtora_id = public.current_org() and public.is_org_manager());

-- towers / units: herdam a visibilidade do empreendimento -----------
create policy towers_select on towers for select
  using (public.can_view_development(development_id));
create policy towers_write on towers for all
  using (exists (select 1 from developments d where d.id = development_id
                 and d.construtora_id = public.current_org())
         and public.is_org_manager());

create policy units_select on units for select
  using (public.can_view_development(development_id));
create policy units_write on units for all
  using (exists (select 1 from developments d where d.id = development_id
                 and d.construtora_id = public.current_org())
         and public.is_org_manager());

create policy ush_select on unit_status_history for select
  using (exists (select 1 from units u where u.id = unit_id
                 and public.can_view_development(u.development_id)));

-- price_tables: corretor só vê a publicada ---------------------------
create policy pt_select_own on price_tables for select
  using (exists (select 1 from developments d where d.id = development_id
                 and d.construtora_id = public.current_org()));
create policy pt_select_published on price_tables for select
  using (status = 'publicada' and public.can_view_development(development_id));
create policy pt_write on price_tables for all
  using (exists (select 1 from developments d where d.id = development_id
                 and d.construtora_id = public.current_org())
         and public.is_org_manager());

create policy pti_select on price_table_items for select
  using (exists (select 1 from price_tables pt where pt.id = price_table_id
                 and (
                   (pt.status = 'publicada' and public.can_view_development(pt.development_id))
                   or exists (select 1 from developments d where d.id = pt.development_id
                              and d.construtora_id = public.current_org())
                 )));
create policy pti_write on price_table_items for all
  using (exists (select 1 from price_tables pt
                 join developments d on d.id = pt.development_id
                 where pt.id = price_table_id
                   and d.construtora_id = public.current_org())
         and public.is_org_manager());

-- materials -----------------------------------------------------------
create policy materials_select on materials for select
  using (is_active and public.can_view_development(development_id));
create policy materials_write on materials for all
  using (exists (select 1 from developments d where d.id = development_id
                 and d.construtora_id = public.current_org())
         and public.is_org_manager());

-- reservations ----------------------------------------------------------
create policy res_select on reservations for select
  using (
    broker_id = auth.uid()
    or (imobiliaria_id = public.current_org() and public.is_org_manager())
    or exists (select 1 from units u join developments d on d.id = u.development_id
               where u.id = unit_id and d.construtora_id = public.current_org())
  );
create policy res_insert on reservations for insert
  with check (broker_id = auth.uid() and imobiliaria_id = public.current_org());
create policy res_decide on reservations for update
  using (
    broker_id = auth.uid()
    or exists (select 1 from units u join developments d on d.id = u.development_id
               where u.id = unit_id and d.construtora_id = public.current_org()
               and public.is_org_manager())
  );

-- leads: telefone NUNCA visível à construtora (usar view reduzida) --------
create policy leads_select on leads for select
  using (broker_id = auth.uid()
         or (imobiliaria_id = public.current_org() and public.is_org_manager()));
create policy leads_write on leads for all
  using (broker_id = auth.uid())
  with check (broker_id = auth.uid() and imobiliaria_id = public.current_org());

-- View reduzida p/ construtora conferir registros sem dados pessoais
create or replace view lead_registrations
with (security_invoker = off) as
  select l.id, l.development_id, l.broker_id, l.imobiliaria_id,
         l.status, l.protection_until, l.created_at
  from leads l;
comment on view lead_registrations is
  'Visão da construtora: confirma existência/ordem dos registros sem expor dados do cliente (LGPD).';

-- notifications -------------------------------------------------------------
create policy notif_select on notifications for select using (user_id = auth.uid());
create policy notif_update on notifications for update using (user_id = auth.uid());
