"use client";

import Link from "next/link";
import { LogOut, UserRound, Loader2 } from "lucide-react";
import { useTransition } from "react";

import { signOut } from "@/lib/auth/actions";
import { initials, ROLE_LABEL, type Profile } from "@/lib/auth/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function UserMenu({
  email,
  profile,
  orgName,
}: {
  email: string;
  profile: Profile;
  orgName: string;
}) {
  const [signingOut, startSignOut] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`Menu do usuário — ${profile.full_name}`}
          className="size-11 rounded-full p-0"
        >
          <Avatar className="size-9">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="" />
            ) : null}
            <AvatarFallback className="bg-atlantico-100 text-sm font-semibold text-atlantico-700">
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium text-foreground">
            {profile.full_name}
          </p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {ROLE_LABEL[profile.role]} · {orgName}
            {profile.creci ? (
              <span className="num"> · CRECI {profile.creci}</span>
            ) : null}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/perfil" className="min-h-11 cursor-pointer">
            <UserRound aria-hidden className="size-4" />
            Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="min-h-11 cursor-pointer"
          disabled={signingOut}
          onSelect={(e) => {
            e.preventDefault();
            startSignOut(() => signOut());
          }}
        >
          {signingOut ? (
            <Loader2 aria-hidden className="size-4 animate-spin" />
          ) : (
            <LogOut aria-hidden className="size-4" />
          )}
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
