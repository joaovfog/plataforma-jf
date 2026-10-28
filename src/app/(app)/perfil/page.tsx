import type { Metadata } from "next";
import { getSessionProfile, ROLE_LABEL } from "@/lib/auth/profile";
import { ProfileForm } from "./profile-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const { user, profile, org } = await getSessionProfile();

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Meu perfil</h1>
        <p className="mt-2 text-muted-foreground">
          É assim que as construtoras identificam quem está atendendo.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{ROLE_LABEL[profile.role]}</Badge>
          <span>{org.name}</span>
          <span aria-hidden>·</span>
          <span>{user.email}</span>
        </div>
      </header>

      <ProfileForm
        profile={{
          full_name: profile.full_name,
          phone: profile.phone ?? "",
          creci: profile.creci ?? "",
        }}
        isBroker={profile.role === "broker"}
      />
    </div>
  );
}
