"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  full_name: z.string().trim().min(3).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?55\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-\s]?\d{4}$/, "Telefone inválido")
    .or(z.literal("")),
  creci: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^\d{3,6}(-?[FJ])?$/, "CRECI inválido")
    .or(z.literal("")),
});

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

/** Atualiza o próprio perfil (RLS: profiles_update_self). */
export async function updateProfile(
  input: z.infer<typeof schema>,
): Promise<UpdateProfileResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos. Revise os campos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Entre de novo." };

  // CRECI é obrigatório para corretor (H0.5)
  const { data: current } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (current?.role === "broker" && !parsed.data.creci) {
    return { ok: false, error: "O CRECI é obrigatório para corretores." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      creci: parsed.data.creci || null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
