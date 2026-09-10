import { createCheckoutSession } from "@/lib/paymongo";
import { getBookingDayCount } from "@/lib/booking-pricing";
import { pesoAmountToCentavos } from "@/lib/utils";

interface BookingCheckoutRecord {
  id: string;
  service_date: string;
  check_out_date: string | null;
  guest_count: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  total_amount: number;
  destination_snapshot: { title?: string; cover_url?: string | null } | null;
  service_snapshot: {
    title?: string;
    price_amount?: number;
    guest_breakdown?: {
      adult_count?: number;
      child_count?: number;
      adult_rate?: number;
      child_rate?: number;
    };
    entrance_fee?: {
      title?: string;
      price_amount?: number;
      guest_count?: number;
    } | null;
    additional_services?: Array<{
      title: string;
      price_amount: number;
    }>;
  } | null;
}

export async function createBookingCheckoutSession(booking: BookingCheckoutRecord) {
  const destinationTitle = booking.destination_snapshot?.title ?? "STABS destination";
  const serviceSnapshot = booking.service_snapshot ?? {};
  const dayCount = booking.check_out_date
    ? getBookingDayCount(booking.service_date, booking.check_out_date)
    : 1;
  const title = serviceSnapshot.title ?? "Booking";
  const lineItems: Array<{
    name: string;
    amount: number;
    quantity: number;
    image?: string;
  }> = [];
  const guestBreakdown = serviceSnapshot.guest_breakdown;
  const image = booking.destination_snapshot?.cover_url ?? undefined;

  if (guestBreakdown) {
    if ((guestBreakdown.adult_count ?? 0) > 0) {
      lineItems.push({
        name: `${destinationTitle} - Adult`,
        amount: pesoAmountToCentavos(guestBreakdown.adult_rate ?? 0),
          quantity: (guestBreakdown.adult_count ?? 0) * dayCount,
        ...(image ? { image } : {})
      });
    }
    if ((guestBreakdown.child_count ?? 0) > 0) {
      lineItems.push({
        name: `${destinationTitle} - Child`,
        amount: pesoAmountToCentavos(guestBreakdown.child_rate ?? 0),
        quantity: (guestBreakdown.child_count ?? 0) * dayCount,
        ...(image ? { image } : {})
      });
    }
  } else if (serviceSnapshot.price_amount) {
    lineItems.push({
      name: `${destinationTitle} - ${title}`,
      amount: pesoAmountToCentavos(serviceSnapshot.price_amount),
      quantity: dayCount,
      ...(image ? { image } : {})
    });
  }

  const entranceFee = serviceSnapshot.entrance_fee;
  if (entranceFee?.price_amount && entranceFee.guest_count) {
    lineItems.push({
      name: entranceFee.title ?? "Entrance Fee",
      amount: pesoAmountToCentavos(entranceFee.price_amount),
      quantity: entranceFee.guest_count
    });
  }

  for (const addon of serviceSnapshot.additional_services ?? []) {
    lineItems.push({
      name: addon.title,
      amount: pesoAmountToCentavos(addon.price_amount),
      quantity: 1
    });
  }

  const session = await createCheckoutSession({
    bookingId: booking.id,
    title: `${destinationTitle} - ${title}`,
    description: `Booking ${booking.id.slice(0, 8).toUpperCase()} for ${booking.service_date} - ${booking.guest_count} guest(s)`,
    amount: booking.total_amount,
    customerName: booking.contact_name,
    customerEmail: booking.contact_email,
    customerPhone: booking.contact_phone,
    lineItems
  });

  return session.data;
}
