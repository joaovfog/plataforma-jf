const status = [
  { rotulo: "Disponível", letra: "D", cls: "bg-status-disponivel text-status-disponivel-fg border-status-disponivel-border" },
  { rotulo: "Reservada", letra: "R", cls: "bg-status-reservada text-status-reservada-fg border-status-reservada-border" },
  { rotulo: "Vendida", letra: "V", cls: "bg-status-vendida text-status-vendida-fg border-status-vendida-border" },
  { rotulo: "Bloqueada", letra: "B", cls: "bg-status-bloqueada text-status-bloqueada-fg border-status-bloqueada-border" },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-duna-500">
          Fase A · Fundação
        </p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">
          Plataforma JF
        </h1>
        <p className="mt-4 max-w-prose text-lg text-muted-foreground">
          Ambiente de desenvolvimento configurado: Next.js, Tailwind v4 e os
          tokens do design system estão ativos. Os cartões abaixo comprovam os
          tokens de status do espelho de vendas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {status.map((s) => (
          <div
            key={s.letra}
            className={`flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border ${s.cls}`}
          >
            <span className="num text-xl font-semibold">1201</span>
            <span className="text-xs font-semibold">
              {s.letra} · {s.rotulo}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5 text-sm leading-relaxed text-card-foreground">
        <p className="font-semibold">Próximos passos (README.md):</p>
        <p className="mt-1 text-muted-foreground">
          1. Criar o projeto no Supabase e preencher o .env.local · 2. Rodar as
          migrações em supabase/migrations · 3. Aplicar o seed · 4. Implementar
          o épico E0 (login, organizações e RLS).
        </p>
      </div>
    </main>
  );
}
