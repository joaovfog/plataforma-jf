// ============================================================
// Teste de RLS (H0.4) — usuário da org A não lê dados da org B.
//
// Pré-requisitos:
//   1. Migrações 0001–0003 e seed.sql aplicados no projeto Supabase.
//   2. Dois usuários de teste com perfil criado (ver README):
//      - corretor da JF Imóveis           → RLS_TEST_BROKER_EMAIL / _PASSWORD
//      - admin da Construtora Horizonte   → RLS_TEST_ADMIN_EMAIL / _PASSWORD
//
// Rodar:  npm run test:rls
// ============================================================

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const BROKER = {
  email: process.env.RLS_TEST_BROKER_EMAIL,
  password: process.env.RLS_TEST_BROKER_PASSWORD,
};
const ADMIN = {
  email: process.env.RLS_TEST_ADMIN_EMAIL,
  password: process.env.RLS_TEST_ADMIN_PASSWORD,
};

const JF_ORG = "a0000000-0000-4000-8000-000000000001";
const HORIZONTE_ORG = "a0000000-0000-4000-8000-000000000002";
const UNIT_1201 = "d0000000-0000-4000-8000-000000000001";

let failures = 0;

function check(label, ok, detail = "") {
  const mark = ok ? "✅" : "❌";
  console.log(`${mark} ${label}${!ok && detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function newClient() {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn({ email, password }) {
  const client = newClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`Não foi possível entrar como ${email}: ${error.message}`);
    process.exit(1);
  }
  return client;
}

if (!URL || !ANON) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local).");
  process.exit(1);
}
if (!BROKER.email || !BROKER.password || !ADMIN.email || !ADMIN.password) {
  console.error(
    "Defina RLS_TEST_BROKER_EMAIL/_PASSWORD e RLS_TEST_ADMIN_EMAIL/_PASSWORD no .env.local.",
  );
  process.exit(1);
}

// ---------- 1. Cliente anônimo: nada vaza ----------
console.log("\n— Anônimo —");
{
  const anon = newClient();
  for (const table of ["organizations", "profiles", "developments", "units", "price_tables", "leads"]) {
    const { data } = await anon.from(table).select("id").limit(1);
    check(`anônimo não lê ${table}`, (data ?? []).length === 0);
  }
}

// ---------- 2. Corretor da JF (imobiliária) ----------
console.log("\n— Corretor · JF Imóveis —");
{
  const jf = await signIn(BROKER);

  const { data: myProfile } = await jf.from("profiles").select("org_id").limit(10);
  check(
    "lê apenas perfis da própria org",
    (myProfile ?? []).length > 0 && myProfile.every((p) => p.org_id === JF_ORG),
  );

  const { data: devs } = await jf.from("developments").select("id, status, construtora_id");
  check(
    "vê empreendimento publicado da parceira (Maré Alta)",
    (devs ?? []).some((d) => d.construtora_id === HORIZONTE_ORG),
  );
  check(
    "não vê rascunhos de outras orgs",
    (devs ?? []).every((d) => d.status !== "rascunho"),
  );

  const { data: pts } = await jf.from("price_tables").select("id, status");
  check(
    "só enxerga tabela de vendas publicada",
    (pts ?? []).length > 0 && pts.every((t) => t.status === "publicada"),
  );

  // Escrita indevida: corretor não altera estoque da construtora
  const { data: updated } = await jf
    .from("units")
    .update({ status: "vendida" })
    .eq("id", UNIT_1201)
    .select();
  check("não consegue alterar status de unidade", (updated ?? []).length === 0);

  // Escrita indevida: não edita perfil de outra org
  const { data: crossUpdate } = await jf
    .from("profiles")
    .update({ full_name: "hackeado" })
    .neq("org_id", JF_ORG)
    .select();
  check("não edita perfis de outra org", (crossUpdate ?? []).length === 0);

  // Escalada de privilégio: não se autopromove a platform_admin
  const {
    data: { user: jfUser },
  } = await jf.auth.getUser();
  const { data: promoted, error: promoteError } = await jf
    .from("profiles")
    .update({ role: "platform_admin" })
    .eq("id", jfUser.id)
    .select();
  check(
    "não consegue se autopromover a platform_admin (migração 0004)",
    Boolean(promoteError) || (promoted ?? []).length === 0,
  );

  await jf.auth.signOut();
}

// ---------- 3. Admin da Construtora Horizonte ----------
console.log("\n— Admin · Construtora Horizonte —");
{
  const hz = await signIn(ADMIN);

  const { data: profiles } = await hz.from("profiles").select("org_id");
  check(
    "lê apenas perfis da própria org",
    (profiles ?? []).length > 0 && profiles.every((p) => p.org_id === HORIZONTE_ORG),
  );

  const { data: leads } = await hz.from("leads").select("client_phone").limit(1);
  check("não acessa telefones de leads (LGPD)", (leads ?? []).length === 0);

  const { data: updated, error } = await hz
    .from("units")
    .update({ status: "bloqueada" })
    .eq("id", UNIT_1201)
    .select();
  check(
    "consegue alterar unidade do próprio empreendimento",
    !error && (updated ?? []).length === 1,
  );

  // Reverte para não sujar o seed
  await hz.from("units").update({ status: "disponivel" }).eq("id", UNIT_1201);

  await hz.auth.signOut();
}

console.log(
  failures === 0
    ? "\nRLS OK: isolamento entre organizações confirmado."
    : `\n${failures} verificação(ões) de RLS falharam.`,
);
process.exit(failures === 0 ? 0 : 1);
