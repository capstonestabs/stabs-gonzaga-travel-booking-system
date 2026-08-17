import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteMobileNav } from "@/components/site/site-mobile-nav";
import { NavigationProgress } from "@/components/site/navigation-progress";
import { PageTransitionShell } from "@/components/site/page-transition-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "STABS | Gonzaga Travel Bookings",
  description:
    "Smart Tourist Assistance and Booking System (STABS) for destination browsing, bookings, and digital payments in the Town of Gonzaga.",
  icons: {
    icon: "/assets/logogonzaga.png",
    shortcut: "/assets/logogonzaga.png",
    apple: "/assets/logogonzaga.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <SiteHeader />
        <main className="flex-1 pb-16 md:pb-0">
          <PageTransitionShell>{children}</PageTransitionShell>
        </main>
        <SiteMobileNav />
        <SiteFooter />
      </body>
    </html>
  );
}

