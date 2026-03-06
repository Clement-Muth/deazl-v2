import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LinguiClientProvider } from "@/lib/i18n/linguiProvider";
import { getLocale, initLingui, getMessages } from "@/lib/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#16a34a",
};

export const metadata: Metadata = {
  title: "Deazl",
  description: "Smart meal planning & grocery management",
  manifest: "/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Deazl",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  await initLingui(locale);
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LinguiClientProvider locale={locale} messages={messages}>
          {children}
        </LinguiClientProvider>
      </body>
    </html>
  );
}
