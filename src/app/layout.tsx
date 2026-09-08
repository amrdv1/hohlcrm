import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HohlCRM — Облік товарів",
  description: "CRM система для обліку товарів з Telegram ботом",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
