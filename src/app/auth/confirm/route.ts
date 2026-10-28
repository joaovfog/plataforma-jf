import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino dos links de e-mail do Supabase (magic link, convite e
 * recuperação de senha). Verifica o token e redireciona para `next`.
 *
 * Configure os templates de e-mail do Supabase para apontar para:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = sanitizeNext(searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      // Convite e recuperação sempre passam pela definição de senha
      const target =
        type === "invite" || type === "recovery" ? "/atualizar-senha" : next;
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  // Fluxo PKCE (?code=) — fallback
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("erro", "link-invalido");
  return NextResponse.redirect(loginUrl);
}

/** Evita open redirect: só aceita caminhos internos. */
function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/painel";
  }
  return next;
}
