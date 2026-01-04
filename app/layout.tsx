import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TimerIQ - Inteligentne Timery",
  description: "Twórz, zarządzaj i udostępniaj timery znajomym. Odliczaj do ważnych wydarzeń lub śledź upływający czas.",
  keywords: ["timer", "countdown", "odliczanie", "wydarzenia", "udostępnianie"],
  authors: [{ name: "TimerIQ" }],
  openGraph: {
    title: "TimerIQ - Inteligentne Timery",
    description: "Twórz, zarządzaj i udostępniaj timery znajomym",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="dark">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
