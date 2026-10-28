import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile } from "@/lib/auth/shared";

export * from "@/lib/auth/shared";

/**
 * Sessão + perfil + organização do usuário atual (RLS garante o escopo).
 * Redireciona para /login sem sessão. `cache()` evita buscas duplicadas
 * entre layout e página na mesma requisição.
 */
export const getSessionProfile = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, org_id, role, full_name, avatar_url, phone, creci, is_active, organizations(id, type, name, cnpj, logo_url, city, state, phone, is_active)",
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Usuário autenticado sem perfil: convite mal configurado.
    redirect("/login?erro=sem-perfil");
  }

  // O join 1-para-1 vem como objeto; o client tipa como array por padrão.
  const { organizations: org, ...rest } = profile as unknown as Profile & {
    organizations: Organization;
  };

  return { user, profile: rest as Profile, org };
});
