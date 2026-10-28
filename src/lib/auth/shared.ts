/** Tipos e helpers puros de auth — seguros para client e server. */

export type UserRole = "platform_admin" | "org_admin" | "manager" | "broker";
export type OrgType = "construtora" | "imobiliaria";

export type Profile = {
  id: string;
  org_id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  creci: string | null;
  is_active: boolean;
};

export type Organization = {
  id: string;
  type: OrgType;
  name: string;
  cnpj: string | null;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  is_active: boolean;
};

export const ROLE_LABEL: Record<UserRole, string> = {
  platform_admin: "Admin da plataforma",
  org_admin: "Administrador",
  manager: "Gestor",
  broker: "Corretor",
};

export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  construtora: "Construtora",
  imobiliaria: "Imobiliária",
};

/** Iniciais para o avatar (ex.: "Maria Souza" → "MS"). */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
