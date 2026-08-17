import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBookingTicketState } from "@/lib/booking-state";
import {
  getBookingGuestTickets,
  verifyGuestTicketToken
} from "@/lib/guest-tickets";
import { hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Booking } from "@/lib/types";
import { getCurrentUserContext } from "@/lib/auth";
import { GuestVisitActions } from "@/components/forms/guest-visit-actions";
import { CircleCheckBig, CircleX, MapPin, Ticket } from "lucide-react";
import { formatCurrency, pesoAmountToCentavos } from "@/lib/utils";

export default async function VerifyGuestTicketPage({
  params,
  searchParams
}: {
  params: Promise<{ bookingId: string; guestNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { bookingId, guestNumber: guestNumberText } = await params;
  const { token } = await searchParams;
  const guestNumber = Number(guestNumberText);
  const signatureIsValid = verifyGuestTicketToken(bookingId, guestNumber, token);

  if (!signatureIsValid || !hasSupabaseServiceEnv()) {
    return <VerificationFailure />;
  }

  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, destination:destinations(*, destination_services(*))")
    .eq("id", bookingId)
    .maybeSingle();

  if (!data) {
    return <VerificationFailure />;
  }

  const booking = data as any;
  const viewer = await getCurrentUserContext();
  const guest = getBookingGuestTickets(booking).find(
    (entry) => entry.guestNumber === guestNumber
  );
  if (!guest) {
    return <VerificationFailure />;
  }

  const ticketState = getBookingTicketState(booking);
  const isValid = ticketState === "valid";
  const { data: visit } = await supabase.from("booking_guest_visits").select("*")
    .eq("booking_id", booking.id).eq("guest_number", guestNumber).maybeSingle();
  const stateLabel =
    ticketState === "valid"
      ? "Valid guest pass"
      : ticketState === "used"
        ? "Pass already used"
        : ticketState === "expired"
          ? "Pass expired"
          : ticketState === "cancelled"
            ? "Booking cancelled"
            : "Payment pending";

  const destination = booking.destination ?? null;
  const allServices = ((destination?.destination_services ?? []) as any[]).filter(
    (service) => service.is_active
  );

  return (
    <div className="page-shell flex justify-center py-10 sm:py-14">
      <Card className="w-full max-w-xl overflow-hidden">
        <CardHeader className={isValid ? "bg-primary text-primary-foreground" : "bg-muted"}>
          <div className="flex items-center gap-3">
            {isValid ? <CircleCheckBig className="h-8 w-8" /> : <CircleX className="h-8 w-8" />}
            <div>
              <p className="text-xs uppercase tracking-[0.16em] opacity-80">QR verification</p>
              <CardTitle className="mt-1 text-inherit">{stateLabel}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="rounded-[1.2rem] border border-slate-200 bg-[#FCFAF6] p-5 font-mono text-slate-800 shadow-sm relative overflow-hidden">
            {/* Top decorative tear line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(90deg,#e2e8f0,#e2e8f0_4px,transparent_4px,transparent_8px)]" />

            <div className="space-y-3 pt-2">
              <div className="flex justify-between gap-2 text-xs">
                <span>Guest Name:</span>
                <span className="font-bold uppercase text-right">{guest.name}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs">
                <span>Total number of Guest:</span>
                <span className="font-bold">{booking.guest_count} person{booking.guest_count === 1 ? "" : "s"}</span>
              </div>
              <div className="border-t border-dashed border-slate-300 my-2" />
              <div className="flex justify-between gap-2 text-xs">
                <span>Ticket code:</span>
                <span className="font-semibold break-all text-right">{guest.ticketCode}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs">
                <span>Visit date:</span>
                <span className="font-bold">{booking.service_date}</span>
              </div>
              
              <div className="border-t border-dashed border-slate-300 my-2" />
              
              {/* Main Service Charges */}
              <div className="space-y-1.5">
                <div className="flex justify-between gap-2 text-xs">
                  <span>
                    {booking.service_snapshot?.title ?? "Entrance Fee"}
                    {booking.destination_snapshot?.category !== "stay" && ` (× ${booking.guest_count} guest${booking.guest_count === 1 ? "" : "s"})`}
                    :
                  </span>
                  <span>
                    {formatCurrency(
                      pesoAmountToCentavos(booking.service_snapshot?.price_amount ?? 0) *
                        (booking.destination_snapshot?.category === "stay" ? 1 : booking.guest_count)
                    )}
                  </span>
                </div>
              </div>

              {/* Additional Services Checklist */}
              {allServices.filter((s) => s.id !== booking.service_id).length > 0 && (
                <div className="border-t border-dashed border-slate-300 pt-2.5 mt-2.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Additional Services
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {allServices
                      .filter((s) => s.id !== booking.service_id)
                      .map((srv) => {
                        const bookedAddon = booking.service_snapshot?.additional_services?.find(
                          (add: any) => add.id === srv.id
                        );
                        const isBooked = Boolean(bookedAddon);
                        const label = isBooked
                          ? `${srv.title} (Qty: ${bookedAddon.quantity})`
                          : srv.title;
                        const priceVal = isBooked
                          ? bookedAddon.price_amount * bookedAddon.quantity
                          : srv.price_amount;

                        return (
                          <div key={srv.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center">
                              <span className="font-mono text-sm leading-none font-bold mr-2 text-slate-700">
                                {isBooked ? "[x]" : "[ ]"}
                              </span>
                              <span className={isBooked ? "font-bold text-slate-900" : "text-slate-500"}>
                                {label}
                              </span>
                            </div>
                            <span className={isBooked ? "font-bold text-slate-900" : "text-slate-500"}>
                              {formatCurrency(pesoAmountToCentavos(priceVal))}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="border-t-2 border-double border-slate-400 my-3" />
              
              <div className="flex justify-between items-center text-sm font-bold pt-1">
                <span>Payment Method: GCash</span>
                <span className="text-base">{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>
          </div>

          {viewer?.role === "staff" && viewer.authUserId === booking.staff_id ? (
            <div className="border-t border-slate-100 pt-4">
              <GuestVisitActions
                bookingId={booking.id}
                guestNumber={guestNumber}
                checkedInAt={visit?.checked_in_at ?? null}
                checkedOutAt={visit?.checked_out_at ?? null}
              />
            </div>
          ) : null}
          <p className="text-xs leading-5 text-muted-foreground text-center">
            This receipt details were retrieved from Gonzaga Travel Booking System (STABS) secure database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function VerificationFailure() {
  return (
    <div className="page-shell flex justify-center py-10 sm:py-14">
      <Card className="w-full max-w-lg">
        <CardContent className="flex gap-3 p-6">
          <CircleX className="h-7 w-7 shrink-0 text-destructive" />
          <div>
            <h1 className="text-xl font-semibold">Invalid guest ticket</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This QR code is incomplete, altered, or no longer belongs to an available booking.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
