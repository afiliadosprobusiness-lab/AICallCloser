import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";

import { LocaleProvider } from "@/components/providers/locale-provider";
import { FirebaseProvider } from "@/components/providers/firebase-provider";
import { getRequestLocale } from "@/lib/i18n/server";

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

export const revalidate = 0;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} className="dark">
      <body className={`${manrope.variable} ${playfair.variable} antialiased`}>
        <LocaleProvider locale={locale}>
          <FirebaseProvider>{children}</FirebaseProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
