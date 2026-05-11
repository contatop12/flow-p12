import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flow P12 — AI Brand Studio",
  description:
    "Canvas de geração de imagens com IA e Brand ID plugável. Identidade visual como nó conectável.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
