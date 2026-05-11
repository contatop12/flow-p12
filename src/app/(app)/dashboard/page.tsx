import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { orgId } = await auth();

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-gray-400 mb-8">
        Bem-vindo ao Flow P12. Crie seu primeiro workflow no Canvas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Workflows" value="—" />
        <StatCard label="Clientes" value="—" />
        <StatCard label="Imagens geradas" value="—" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-white font-semibold mb-2">Começar</h2>
        <p className="text-gray-400 text-sm">
          1. Cadastre um cliente em{" "}
          <a href="/clients" className="text-purple-400 underline">
            Clientes
          </a>{" "}
          com paleta, fonte e tom visual.
          <br />
          2. Abra o{" "}
          <a href="/canvas" className="text-purple-400 underline">
            Canvas
          </a>{" "}
          e arraste os nós Text, Brand ID e Generate.
          <br />
          3. Conecte e execute para gerar sua primeira imagem.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
