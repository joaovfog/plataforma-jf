"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionProfile } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";

const orgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["construtora", "imobiliaria"]),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, "CNPJ inválido")
    .or(z.literal("")),
  city: z.string().trim().max(80),
});

export type CreateOrgResult = { ok: true } | { ok: false; error: string };

/**
 * Cadastro de organizações (H0.1) — onboarding assistido, restrito
 * ao admin da plataforma. Usa a service role: organizations não tem
 * política de INSERT via RLS de propósito.
 */
export async function createOrganization(
  input: z.infer<typeof orgSchema>,
): Promise<CreateOrgResult> {
  const parsed = orgSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos. Revise os campos." };
  }

  const { profile } = await getSessionProfile();
  if (profile.role !== "platform_admin") {
    return { ok: false, error: "Apenas o admin da plataforma cadastra organizações." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("organizations").insert({
    name: parsed.data.name,
    type: parsed.data.type,
    cnpj: parsed.data.cnpj || null,
    city: parsed.data.city || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Já existe uma organização com este CNPJ." };
    }
    return { ok: false, error: "Não foi possível cadastrar. Tente novamente." };
  }

  revalidatePath("/admin/organizacoes");
  return { ok: true };
}
