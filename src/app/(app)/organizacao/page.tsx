import type { Metadata } from "next";
import {
  getSessionProfile,
  initials,
  ORG_TYPE_LABEL,
  ROLE_LABEL,
  type Profile,
} from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteDialog } from "./invite-dialog";

export const metadata: Metadata = { title: "Organização" };

export default async function OrganizacaoPage() {
  const { profile, org } = await getSessionProfile();
  const supabase = await createClient();

  // RLS: retorna somente perfis da própria organização
  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role, creci, phone, is_active")
    .eq("org_id", org.id)
    .order("full_name");

  const team = (members ?? []) as Pick<
    Profile,
    "id" | "full_name" | "role" | "creci" | "phone" | "is_active"
  >[];

  const isManager = ["org_admin", "manager", "platform_admin"].includes(
    profile.role,
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-duna-500">
            {ORG_TYPE_LABEL[org.type]}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{org.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {[org.city, org.state].filter(Boolean).join(" · ")}
            {org.cnpj ? (
              <>
                {" "}
                · CNPJ <span className="num">{org.cnpj}</span>
              </>
            ) : null}
          </p>
        </div>

        {isManager ? <InviteDialog /> : null}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Equipe{" "}
            <span className="num text-base font-normal text-muted-foreground">
              ({team.length})
            </span>
          </CardTitle>
          <CardDescription>
            Quem tem acesso ao ambiente da {org.name}.
            {isManager
              ? " Convide novos membros pelo botão acima — eles definem a senha no primeiro acesso."
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {team.map((m) => (
              <li key={m.id} className="flex items-center gap-4 py-3.5">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-atlantico-100 text-sm font-semibold text-atlantico-700">
                    {initials(m.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {m.full_name}
                    {m.id === profile.id ? (
                      <span className="text-muted-foreground"> (você)</span>
                    ) : null}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {ROLE_LABEL[m.role]}
                    {m.creci ? (
                      <span className="num"> · CRECI {m.creci}</span>
                    ) : null}
                    {m.phone ? <span className="num"> · {m.phone}</span> : null}
                  </p>
                </div>

                {!m.is_active ? (
                  <Badge variant="outline" className="shrink-0">
                    Inativo
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>

          {team.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum membro encontrado.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
