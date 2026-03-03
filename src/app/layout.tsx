import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LinguiProvider } from "@/lib/i18n/linguiProvider";
import { defaultLocale } from "@/lib/i18n/i18n";
import { getMessages } from "@/lib/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deazl",
  description: "Smart meal planning & grocery management",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages(defaultLocale);

  return (
    <html lang={defaultLocale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LinguiProvider locale={defaultLocale} messages={messages}>
          {children}
        </LinguiProvider>
      </body>
    </html>
  );
}
