import Link from "next/link";
import type { Route } from "next";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="page-shell space-y-6 py-10 sm:py-14">
      <header className="max-w-3xl space-y-3">
        <div className="gradient-chip w-fit">Privacy notice</div>
        <h1 className="page-title">How STABS handles your information</h1>
        <p className="page-intro">Effective August 6, 2026. This notice explains the information used to provide destination booking services.</p>
      </header>
      <Card>
        <CardContent className="space-y-6 p-5 text-sm leading-7 text-muted-foreground sm:p-8">
          <section><h2 className="text-xl font-semibold text-foreground">Information we collect</h2><p className="mt-2">STABS processes account details, contact information, guest names and types, booking dates, destination selections, payment references and statuses, uploaded profile images, feedback, and recorded check-in/check-out times. Payment credentials are entered on PayMongo and are not stored by STABS.</p></section>
          <section><h2 className="text-xl font-semibold text-foreground">Why it is used</h2><p className="mt-2">We use this information to create and secure accounts, reserve capacity, process and reconcile payments or refunds, issue and verify guest tickets, record visits, communicate booking results, prevent fraud, and maintain operational and financial records.</p></section>
          <section><h2 className="text-xl font-semibold text-foreground">Who receives it</h2><p className="mt-2">Booking information is available to assigned destination staff and authorized STABS administrators. Necessary data is also processed by configured service providers, including Supabase for authentication, database and storage services, PayMongo for payments and refunds, and the platform hosting and email providers.</p></section>
          <section><h2 className="text-xl font-semibold text-foreground">Retention and choices</h2><p className="mt-2">Records are retained while needed for bookings, security, accounting, dispute handling, and applicable obligations. You may update your profile and clear eligible booking history. Financial and security records may be preserved when a visible booking is cleared.</p></section>
          <section><h2 className="text-xl font-semibold text-foreground">Privacy requests</h2><p className="mt-2">You may request access, correction, or deletion where applicable by contacting the destination through its published details or submitting the site feedback form. Identity verification may be required.</p></section>
          <p className="rounded-[1rem] bg-muted/50 p-4">See the <Link href={"/ai-disclosure" as Route} className="font-semibold text-primary underline">AI Disclosure</Link> for information about automated features.</p>
        </CardContent>
      </Card>
    </div>
  );
}
