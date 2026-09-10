import { Route } from "next";
import Link from "next/link";

import { OnsiteBookingReview } from "@/components/forms/onsite-booking-review";
import { buttonVariants } from "@/components/ui/button";

export default function OnsiteCheckoutPage() {
  return (
    <div className="page-shell space-y-5 py-8 sm:py-12">
      <Link href="/destinations" className={buttonVariants({ variant: "ghost" }) as Route}>
        Back to destinations
      </Link>
      <header className="max-w-2xl space-y-2">
        <div className="gradient-chip w-fit">Reservation review</div>
        <h1 className="page-title">Review your onsite reservation</h1>
        <p className="page-intro">
          Check the details below before submitting your reservation for staff confirmation.
        </p>
      </header>
      <OnsiteBookingReview />
    </div>
  );
}
