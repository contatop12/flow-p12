export default function DashboardPage() {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-[#18181B]">
          Dashboard
        </h1>
        <p className="mt-0.5 text-sm text-[#71717A]">
          Bem-vindo ao Flow P12.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Workflows" value="0" />
        <StatCard label="Clientes" value="0" />
        <StatCard label="Imagens geradas" value="0" />
      </div>

      <div className="rounded-xl border bg-white p-6">
        <p className="mb-5 text-xs font-medium uppercase tracking-widest text-[#A1A1AA]">
          Como começar
        </p>
        <ol className="space-y-4">
          <Step n="01">
            Cadastre um cliente em{" "}
            <a
              href="/clients"
              className="font-medium text-[#18181B] underline decoration-[#E5E2DB] underline-offset-2 transition-colors hover:decoration-[#18181B]"
            >
              Clientes
            </a>{" "}
            com paleta, fonte e tom visual.
          </Step>
          <Step n="02">
            Abra o{" "}
            <a
              href="/canvas"
              className="font-medium text-[#18181B] underline decoration-[#E5E2DB] underline-offset-2 transition-colors hover:decoration-[#18181B]"
            >
              Canvas
            </a>{" "}
            e arraste os nós Text, Brand ID e Generate.
          </Step>
          <Step n="03">Conecte e execute para gerar sua primeira imagem.</Step>
        </ol>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-[#18181B]">
        {value}
      </p>
    </div>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-0.5 w-6 shrink-0 text-xs font-medium tabular-nums text-[#A1A1AA]">
        {n}
      </span>
      <p className="text-sm leading-relaxed text-[#52525B]">{children}</p>
    </li>
  );
}
