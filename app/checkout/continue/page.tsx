import { CheckoutContinueCard } from "@/components/forms/checkout-continue-card";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/repositories";
import { getCheckoutPaymentMethods } from "@/lib/paymongo";
import { CalendarCheck2, Check, CircleCheckBig, CreditCard, Users } from "lucide-react";

export default async function CheckoutContinuePage() {
  const user = await getCurrentUserContext();
  const pendingBooking =
    user?.role === "user"
      ? (await getBookingsForUser(user.authUserId)).find((booking) => booking.status === "pending_payment") ?? null
      : null;

  return (
    <div className="page-shell space-y-6 py-10 sm:py-12">
      <div className="max-w-3xl space-y-3">
        <div className="gradient-chip w-fit">Booking review</div>
        <h1 className="page-title">
          Take one last look before you continue.
        </h1>
        <p className="page-intro">
          Review the destination, date, guests, and contact details before you continue to the
          secure confirmation step.
        </p>
      </div>

      <ol className="grid gap-2 rounded-[1.2rem] border border-border/70 bg-card p-3 shadow-[0_10px_28px_rgba(22,74,47,0.06)] sm:grid-cols-4">
        {[
          { label: "Date selection", icon: CalendarCheck2, complete: true },
          { label: "Guest information", icon: Users, complete: true },
          { label: "Payment", icon: CreditCard, complete: false },
          { label: "Confirmation", icon: CircleCheckBig, complete: false }
        ].map(({ label, icon: Icon, complete }, index) => (
          <li key={label} className={`flex items-center gap-2.5 rounded-[0.9rem] px-3 py-2.5 text-xs font-semibold ${index === 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${index === 2 ? "bg-white/15" : complete ? "bg-accent text-accent-foreground" : "bg-muted"}`}>
              {complete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            </span>
            {label}
          </li>
        ))}
      </ol>

      <CheckoutContinueCard
        viewerRole={user?.role ?? null}
        viewerEmail={user?.email ?? null}
        requiresAccount
        paymentMethods={getCheckoutPaymentMethods()}
        pendingBooking={
          pendingBooking
            ? {
                id: pendingBooking.id,
                destinationTitle: pendingBooking.destination_snapshot.title,
                serviceTitle: pendingBooking.service_snapshot?.title ?? "Standard service",
                serviceDate: pendingBooking.service_date,
                checkoutUrl: pendingBooking.payment?.checkout_url ?? null
              }
            : null
        }
      />
    </div>
  );
}
