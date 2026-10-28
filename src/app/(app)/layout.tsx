import Link from "next/link";
import { getSessionProfile, ORG_TYPE_LABEL } from "@/lib/auth/profile";
import { Badge } from "@/components/ui/badge";
import { AppNav } from "@/components/app-nav";
import { UserMenu } from "@/components/user-menu";

/** Layout autenticado: identifica usuário e organização em todas as telas. */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, profile, org } = await getSessionProfile();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/painel"
            className="flex items-center gap-2.5 font-display text-base font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              JF
            </span>
            <span className="hidden sm:inline">Plataforma JF</span>
          </Link>

          <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />

          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">{org.name}</span>
            <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
              {ORG_TYPE_LABEL[org.type]}
            </Badge>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <AppNav
              role={profile.role}
              className="hidden md:flex"
              variant="header"
            />
            <UserMenu
              email={user.email ?? ""}
              profile={profile}
              orgName={org.name}
            />
          </div>
        </div>

        {/* Navegação móvel: alvos de toque ≥44px, rolagem horizontal suave */}
        <AppNav
          role={profile.role}
          variant="mobile"
          className="flex overflow-x-auto border-t px-2 md:hidden"
        />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
