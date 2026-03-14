import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

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
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
