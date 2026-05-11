import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flow P12",
  description: "Brand ID Visual Flow Builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
