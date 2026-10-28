import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Acesse o catálogo, as tabelas de vendas e o espelho em tempo real.",
};

const STATUS_CHIPS = [
  { rotulo: "Disponível", cls: "bg-status-disponivel-fg" },
  { rotulo: "Reservada", cls: "bg-status-reservada-fg" },
  { rotulo: "Vendida", cls: "bg-status-vendida-fg" },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Painel da marca — visível a partir de lg */}
      <section
        aria-hidden
        className="relative hidden overflow-hidden bg-atlantico-900 lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(80% 60% at 20% 10%, var(--color-atlantico-700) 0%, transparent 60%), radial-gradient(70% 50% at 90% 90%, var(--color-atlantico-800) 0%, transparent 55%)",
          }}
        />
        <p className="relative font-mono text-xs uppercase tracking-[0.18em] text-atlantico-200">
          Plataforma JF
        </p>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight text-atlantico-50">
            O canal entre construtoras e imobiliárias do litoral catarinense.
          </h1>
          <p className="mt-4 text-lg text-atlantico-200">
            Catálogo de empreendimentos, tabelas versionadas e espelho de
            vendas em tempo real — sem caçar PDF em grupo de WhatsApp.
          </p>
        </div>

        <div className="relative flex items-center gap-5">
          {STATUS_CHIPS.map((s) => (
            <span
              key={s.rotulo}
              className="flex items-center gap-2 text-sm text-atlantico-100"
            >
              <span className={`size-2.5 rounded-full ${s.cls}`} />
              {s.rotulo}
            </span>
          ))}
          <span className="text-sm text-atlantico-300">· em tempo real</span>
        </div>
      </section>

      {/* Formulário */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <header className="mb-8 lg:hidden">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-duna-500">
              Plataforma JF
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Bem-vindo de volta</h1>
            <p className="mt-1 text-muted-foreground">
              Entre para acessar o catálogo e o espelho de vendas.
            </p>
          </header>
          <header className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-semibold">Bem-vindo de volta</h2>
            <p className="mt-1 text-muted-foreground">
              Entre para acessar o catálogo e o espelho de vendas.
            </p>
          </header>

          <Suspense>
            <LoginForm />
          </Suspense>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Ainda sem acesso? Fale com o gestor da sua imobiliária ou
            construtora — o cadastro é feito por convite.
          </p>
        </div>
      </section>
    </main>
  );
}
