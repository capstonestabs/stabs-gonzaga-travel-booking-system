import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
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
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <SiteHeader />
        <main>
          <PageTransitionShell>{children}</PageTransitionShell>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
