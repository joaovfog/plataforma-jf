import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/** Proxy (ex-middleware no Next 16): renova a sessão e protege rotas. */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Tudo, exceto:
     * - _next/static, _next/image (assets do Next)
     * - favicon e arquivos estáticos comuns
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
