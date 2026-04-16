import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, LXGW_WenKai_TC } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const wenkai = LXGW_WenKai_TC({
  variable: "--font-wenkai",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#c2553a",
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "EDTech — 互動教學平台",
  description: "數位互動教材，讓學習更有趣",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EDTech",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} ${wenkai.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <Script id="init-theme" strategy="beforeInteractive">{`try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`}</Script>
      <Script id="register-sw" strategy="afterInteractive">{`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`}</Script>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PageTransition />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
