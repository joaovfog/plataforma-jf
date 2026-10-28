-- ============================================================
-- Plataforma JF — Migração 0004: proteção de papel e organização
--
-- Problema: profiles_update_self permite UPDATE na própria linha,
-- e RLS não restringe colunas — qualquer usuário autenticado
-- poderia se autopromover a platform_admin via PostgREST.
--
-- Solução: trigger que só deixa role/org_id mudarem fora de uma
-- requisição autenticada comum (service role, SQL Editor/postgres).
-- ============================================================

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role
      or new.org_id is distinct from old.org_id)
     and coalesce(auth.role(), 'service_role') = 'authenticated' then
    raise exception
      'Papel e organização só mudam via service role (admin da plataforma).';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_columns on profiles;

create trigger protect_profile_columns
  before update on profiles
  for each row
  execute function public.protect_profile_columns();
