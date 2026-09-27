import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Divine Collective CRM",
  description: "Contacts, calendar, programs, and email funnels for Divine Collective LLC.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
