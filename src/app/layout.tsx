import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

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
    <html lang="pt-BR" className={outfit.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
