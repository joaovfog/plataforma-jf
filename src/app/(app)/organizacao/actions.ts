"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  email: z.string().trim().email(),
  full_name: z.string().trim().min(3).max(120),
  role: z.enum(["org_admin", "manager", "broker"]),
});

export type InviteResult = { ok: true } | { ok: false; error: string };

/**
 * Convite por e-mail (H0.2): o link mágico leva o convidado a definir
 * a senha no primeiro acesso. O papel viaja nos metadados e vira perfil
 * via trigger `handle_new_user` (migração 0003).
 */
export async function inviteUser(
  input: z.infer<typeof inviteSchema>,
): Promise<InviteResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos. Revise os campos." };
  }

  // Autorização: apenas gestores/admins da organização convidam
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre de novo." };

  const { data: me } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!me || !["org_admin", "manager", "platform_admin"].includes(me.role)) {
    return { ok: false, error: "Você não tem permissão para convidar." };
  }

  // org_admin só pode ser criado por outro org_admin (ou admin da plataforma)
  if (parsed.data.role === "org_admin" && me.role === "manager") {
    return {
      ok: false,
      error: "Somente administradores convidam outros administradores.",
    };
  }

  const admin = createAdminClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        org_id: me.org_id,
        role: parsed.data.role,
        full_name: parsed.data.full_name,
      },
      redirectTo: `${siteUrl}/auth/confirm?next=/atualizar-senha`,
    },
  );

  if (error) {
    if (error.code === "email_exists") {
      return { ok: false, error: "Este e-mail já tem cadastro na plataforma." };
    }
    return {
      ok: false,
      error: "Não foi possível enviar o convite. Tente novamente.",
    };
  }

  revalidatePath("/organizacao");
  return { ok: true };
}
