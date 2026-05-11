export default async function DashboardPage() {
  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#18181B] tracking-tight">
          Dashboard
        </h1>
        <p className="mt-0.5 text-sm text-[#71717A]">
          Bem-vindo ao Flow P12.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Workflows" value="0" />
        <StatCard label="Clientes" value="0" />
        <StatCard label="Imagens geradas" value="0" />
      </div>

      {/* Getting started */}
      <div className="bg-white rounded-xl border p-6">
        <p className="text-xs font-medium text-[#A1A1AA] uppercase tracking-widest mb-5">
          Como começar
        </p>
        <ol className="space-y-4">
          <Step n="01">
            Cadastre um cliente em{" "}
            <a href="/clients" className="text-[#18181B] font-medium underline underline-offset-2 decoration-[#E5E2DB] hover:decoration-[#18181B] transition-colors">
              Clientes
            </a>{" "}
            com paleta, fonte e tom visual.
          </Step>
          <Step n="02">
            Abra o{" "}
            <a href="/canvas" className="text-[#18181B] font-medium underline underline-offset-2 decoration-[#E5E2DB] hover:decoration-[#18181B] transition-colors">
              Canvas
            </a>{" "}
            e arraste os nós Text, Brand ID e Generate.
          </Step>
          <Step n="03">
            Conecte e execute para gerar sua primeira imagem.
          </Step>
        </ol>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <p className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest">
        {label}
      </p>
      <p className="text-3xl font-semibold text-[#18181B] mt-2 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="text-xs font-medium text-[#A1A1AA] w-6 shrink-0 mt-0.5 tabular-nums">
        {n}
      </span>
      <p className="text-sm text-[#52525B] leading-relaxed">{children}</p>
    </li>
  );
}
