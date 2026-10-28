import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile, ORG_TYPE_LABEL, type Organization } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateOrgDialog } from "./create-org-dialog";

export const metadata: Metadata = { title: "Organizações" };

export default async function AdminOrganizacoesPage() {
  const { profile } = await getSessionProfile();
  if (profile.role !== "platform_admin") redirect("/painel");

  // Admin da plataforma enxerga todas (inclusive inativas): service role
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, type, name, cnpj, city, state, is_active")
    .order("created_at", { ascending: false });

  const orgs = (data ?? []) as Pick<
    Organization,
    "id" | "type" | "name" | "cnpj" | "city" | "state" | "is_active"
  >[];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-duna-500">
            Administração da plataforma
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Organizações</h1>
          <p className="mt-2 max-w-prose text-muted-foreground">
            Onboarding assistido: cadastre construtoras e imobiliárias e depois
            convide o primeiro administrador pela página da organização.
          </p>
        </div>
        <CreateOrgDialog />
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {orgs.map((o) => (
          <Card key={o.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="truncate text-base">{o.name}</CardTitle>
                <div className="flex shrink-0 gap-2">
                  <Badge
                    variant={o.type === "construtora" ? "default" : "secondary"}
                  >
                    {ORG_TYPE_LABEL[o.type]}
                  </Badge>
                  {!o.is_active ? <Badge variant="outline">Inativa</Badge> : null}
                </div>
              </div>
              <CardDescription>
                {[o.city, o.state].filter(Boolean).join(" · ") || "Cidade não informada"}
              </CardDescription>
            </CardHeader>
            {o.cnpj ? (
              <CardContent className="pt-0">
                <p className="num text-sm text-muted-foreground">
                  CNPJ {o.cnpj}
                </p>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </section>

      {orgs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma organização cadastrada ainda. Comece pela JF Imóveis e uma
            construtora de teste (ver seed).
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
