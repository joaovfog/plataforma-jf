import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Definir senha" };

/**
 * Definição/redefinição de senha. Alcançada após o clique no link de
 * convite (H0.2) ou de recuperação (H0.3) — a sessão já existe aqui.
 */
export default async function AtualizarSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-duna-500">
            Plataforma JF
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Defina sua senha</h1>
          <p className="mt-1 text-muted-foreground">
            Você está entrando como{" "}
            <span className="font-medium text-foreground">{user.email}</span>.
            Escolha uma senha para os próximos acessos.
          </p>
        </header>

        <UpdatePasswordForm />
      </div>
    </main>
  );
}
