import "./globals.css";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata = {
  title: "iPhone Lab | Tienda y Reparaciones",
  description: "Sistema completo de ventas y gestion interna para iPhones y accesorios."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
      <body className="app-body">{children}</body>
    </html>
  );
}

