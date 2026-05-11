import { ClientsClient } from "./ClientsClient";

export default function ClientsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[#18181B] tracking-tight">Clientes</h1>
        <p className="mt-0.5 text-sm text-[#71717A]">Gerencie seus Brand IDs.</p>
      </div>
      <ClientsClient />
    </div>
  );
}
