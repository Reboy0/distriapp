import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Адмін-панель",
  description: "Адмін-панель — керування дистриб'юторами та моніторинг інтеграцій 1С",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
