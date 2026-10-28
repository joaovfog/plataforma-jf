-- ============================================================
-- Plataforma JF — Migração 0003: perfil automático no convite
-- O convite (auth.admin.inviteUserByEmail) carrega org_id, role e
-- full_name nos metadados; este trigger materializa o profile.
-- ============================================================

-- Correção de segurança: org_select valia também para o papel anon,
-- expondo a lista de organizações ativas sem login. Restringe a
-- usuários autenticados (busca de parceria continua funcionando).
drop policy if exists org_select on organizations;
create policy org_select on organizations for select
  to authenticated
  using (id = public.current_org() or is_active);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, org_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'org_id')::uuid,
    coalesce(
      (new.raw_user_meta_data ->> 'role')::user_role,
      'broker'
    ),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

-- Só cria perfil quando o convite veio com organização definida.
-- Usuários criados manualmente no painel (sem metadados) continuam
-- exigindo insert manual em profiles (fluxo do README).
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  when (new.raw_user_meta_data ? 'org_id')
  execute function public.handle_new_user();
