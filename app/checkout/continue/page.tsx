import { CheckoutContinueCard } from "@/components/forms/checkout-continue-card";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/repositories";

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

      <CheckoutContinueCard
        viewerRole={user?.role ?? null}
        viewerEmail={user?.email ?? null}
        requiresAccount
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
