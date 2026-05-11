import { DashboardGrid } from "@/components/dashboard/DashboardGrid";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8 max-w-6xl">
        <h1 className="text-xl font-semibold tracking-tight text-[#18181B]">
          Dashboard
        </h1>
        <p className="mt-0.5 text-sm text-[#71717A]">Bem-vindo ao Flow P12.</p>
      </div>

      <DashboardGrid />
    </div>
  );
}
