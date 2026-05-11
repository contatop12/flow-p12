import { ClientsClient } from "./ClientsClient";

export default function ClientsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-ink tracking-tight">Clientes</h1>
        <p className="mt-0.5 text-sm text-muted">Gerencie seus Brand IDs.</p>
      </div>
      <ClientsClient />
    </div>
  );
}
