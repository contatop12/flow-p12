import { Navbar } from "@/components/nav/Navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-auto bg-bg text-ink">{children}</main>
    </div>
  );
}
