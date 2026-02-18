import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";

import { FirebaseProvider } from "@/components/providers/firebase-provider";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Call Closer",
  description: "SaaS premium multi-tenant para cerrar ventas con llamadas IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${manrope.variable} ${playfair.variable} antialiased`}>
        <FirebaseProvider>{children}</FirebaseProvider>
      </body>
    </html>
  );
}
