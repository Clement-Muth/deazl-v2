import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LinguiProvider } from "@/lib/i18n/linguiProvider";
import { defaultLocale } from "@/lib/i18n/i18n";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={defaultLocale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LinguiProvider locale={defaultLocale}>
          {children}
        </LinguiProvider>
      </body>
    </html>
  );
}
