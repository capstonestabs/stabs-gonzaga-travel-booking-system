import { Card, CardContent } from "@/components/ui/card";

export default function AiDisclosurePage() {
  return (
    <div className="page-shell space-y-6 py-10 sm:py-14">
      <header className="max-w-3xl space-y-3">
        <div className="gradient-chip w-fit">AI transparency</div>
        <h1 className="page-title">AI and automated processing disclosure</h1>
        <p className="page-intro">Effective August 6, 2026.</p>
      </header>
      <Card>
        <CardContent className="space-y-6 p-5 text-sm leading-7 text-muted-foreground sm:p-8">
          <section><h2 className="text-xl font-semibold text-foreground">Current use of AI</h2><p className="mt-2">STABS does not currently use generative AI, facial recognition, biometric identification, automated profiling, or AI-based decisions to approve, reject, rank, or price tourist bookings.</p></section>
          <section><h2 className="text-xl font-semibold text-foreground">Rules-based automation</h2><p className="mt-2">The platform uses ordinary software rules to calculate prices and remaining capacity, prevent double booking, expire unpaid slot holds, confirm payments, validate signed QR tickets, and update booking status. These rules are not AI models.</p></section>
          <section><h2 className="text-xl font-semibold text-foreground">Future changes</h2><p className="mt-2">If an AI-assisted feature is introduced, STABS will identify it where it appears, explain its purpose and limitations, describe the information it processes, and update this disclosure before relying on it for users.</p></section>
          <section><h2 className="text-xl font-semibold text-foreground">Human assistance</h2><p className="mt-2">Questions or disputes about availability, check-in, cancellation, refunds, or requirements can be raised with assigned destination staff through the published contact information.</p></section>
        </CardContent>
      </Card>
    </div>
  );
}
