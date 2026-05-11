export default function DashboardPage() {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted">Bem-vindo ao Flow P12.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Workflows" value="0" />
        <StatCard label="Clientes" value="0" />
        <StatCard label="Imagens geradas" value="0" />
      </div>

      <div className="rounded-xl border border-white/10 bg-surface p-6">
        <p className="mb-5 text-xs font-medium uppercase tracking-widest text-subtle">
          Como começar
        </p>
        <ol className="space-y-4">
          <Step n="01">
            Cadastre um cliente em{" "}
            <a
              href="/clients"
              className="font-medium text-ink underline decoration-white/20 underline-offset-2 transition-colors hover:decoration-accent"
            >
              Clientes
            </a>{" "}
            com paleta, fonte e tom visual.
          </Step>
          <Step n="02">
            Abra o{" "}
            <a
              href="/canvas"
              className="font-medium text-ink underline decoration-white/20 underline-offset-2 transition-colors hover:decoration-accent"
            >
              Canvas
            </a>{" "}
            e ligue Text, Brand ID e Image-Layout ao nó Output.
          </Step>
          <Step n="03">Use o botão de play no Output para gerar a imagem.</Step>
        </ol>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-surface p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-0.5 w-6 shrink-0 text-xs font-medium tabular-nums text-subtle">{n}</span>
      <p className="text-sm leading-relaxed text-muted">{children}</p>
    </li>
  );
}
