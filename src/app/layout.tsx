import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";

import { LocaleProvider } from "@/components/providers/locale-provider";
import { FirebaseProvider } from "@/components/providers/firebase-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { getRequestLocale } from "@/lib/i18n/server";
import { getThemeInitScript } from "@/lib/theme/init-script";
import { getRequestTheme } from "@/lib/theme/server";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ai-call-closer.vercel.app"),
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    shortcut: ["/icon"],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  openGraph: {
    title: "AI Call Closer",
    description: "SaaS premium multi-tenant para cerrar ventas con llamadas IA.",
    url: "https://ai-call-closer.vercel.app",
    siteName: "AI Call Closer",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AI Call Closer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Call Closer",
    description: "SaaS premium multi-tenant para cerrar ventas con llamadas IA.",
    images: ["/twitter-image"],
  },
};

export const revalidate = 0;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const theme = await getRequestTheme();
  const themeInitScript = getThemeInitScript();

  return (
    <html lang={locale} className={`${theme} notranslate`} translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <script id="theme-init-script" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${manrope.variable} ${playfair.variable} notranslate antialiased`} translate="no">
        <ThemeProvider theme={theme}>
          <LocaleProvider locale={locale}>
            <FirebaseProvider>
              <div id="floating-header-root" />
              <div id="app-theme-root">{children}</div>
            </FirebaseProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
