import type { Metadata } from "next";
import "./globals.css";
import LanguageProvider from "./components/i18n/language-provider";
import "./components/i18n/language.css";

export const metadata: Metadata = {
  title: "GRACE PRO — Commercial Intelligence",
  description: "Understand your clients, discover their profiles and turn insights into business opportunities.",
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
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="antialiased"><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
