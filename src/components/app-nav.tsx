"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UserRound, Building2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/shared";

const ITEMS = [
  { href: "/painel", label: "Painel", icon: LayoutDashboard },
  { href: "/perfil", label: "Perfil", icon: UserRound },
  { href: "/organizacao", label: "Organização", icon: Building2 },
] as const;

const ADMIN_ITEM = {
  href: "/admin/organizacoes",
  label: "Administração",
  icon: ShieldCheck,
} as const;

export function AppNav({
  role,
  variant,
  className,
}: {
  role: UserRole;
  variant: "header" | "mobile";
  className?: string;
}) {
  const pathname = usePathname();
  const items =
    role === "platform_admin" ? [...ITEMS, ADMIN_ITEM] : [...ITEMS];

  return (
    <nav aria-label="Navegação principal" className={cn("items-center", className)}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
              variant === "mobile" &&
                active &&
                "border-b-2 border-primary rounded-none",
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
