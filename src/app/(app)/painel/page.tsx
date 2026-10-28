import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, UserRound, Users } from "lucide-react";
import {
  getSessionProfile,
  ORG_TYPE_LABEL,
  ROLE_LABEL,
} from "@/lib/auth/profile";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelPage() {
  const { profile, org } = await getSessionProfile();
  const firstName = profile.full_name.split(" ")[0];
  const isManager = ["org_admin", "manager", "platform_admin"].includes(
    profile.role,
  );

  const needsCreci = profile.role === "broker" && !profile.creci;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-duna-500">
          {ORG_TYPE_LABEL[org.type]} · {org.city ?? "SC"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
          Olá, {firstName}
        </h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Você está no ambiente da{" "}
          <span className="font-medium text-foreground">{org.name}</span> como{" "}
          {ROLE_LABEL[profile.role].toLowerCase()}.
        </p>
      </header>

      {needsCreci ? (
        <Card className="border-status-reservada-border bg-status-reservada">
          <CardHeader>
            <CardTitle className="text-base text-status-reservada-fg">
              Complete seu perfil
            </CardTitle>
            <CardDescription className="text-status-reservada-fg/80">
              O CRECI é obrigatório para corretores — as construtoras precisam
              saber quem está atendendo.{" "}
              <Link href="/perfil" className="font-medium underline underline-offset-4">
                Preencher agora
              </Link>
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section aria-label="Atalhos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/perfil" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/40">
            <CardHeader>
              <UserRound aria-hidden className="size-5 text-primary" />
              <CardTitle className="flex items-center justify-between text-base">
                Meu perfil
                <ArrowRight
                  aria-hidden
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </CardTitle>
              <CardDescription>
                Nome, telefone e CRECI — sua identificação nas construtoras.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/organizacao" className="group">
          <Card className="h-full transition-colors group-hover:border-primary/40">
            <CardHeader>
              {isManager ? (
                <Users aria-hidden className="size-5 text-primary" />
              ) : (
                <Building2 aria-hidden className="size-5 text-primary" />
              )}
              <CardTitle className="flex items-center justify-between text-base">
                {isManager ? "Equipe e organização" : "Minha organização"}
                <ArrowRight
                  aria-hidden
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
              </CardTitle>
              <CardDescription>
                {isManager
                  ? "Convide corretores e gestores por e-mail e acompanhe a equipe."
                  : "Veja os dados e a equipe da sua organização."}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="h-full border-dashed">
          <CardHeader>
            <Badge variant="outline" className="w-fit">
              Em breve
            </Badge>
            <CardTitle className="text-base text-muted-foreground">
              Catálogo e espelho de vendas
            </CardTitle>
            <CardDescription>
              Fase B/C do MVP: empreendimentos, materiais e disponibilidade em
              tempo real.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
