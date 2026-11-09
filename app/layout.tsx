import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATELIER. — Inteligência Comercial",
  description: "Uma experiência premium para mapear clientes, identificar perfis e transformar dados em ações comerciais.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
