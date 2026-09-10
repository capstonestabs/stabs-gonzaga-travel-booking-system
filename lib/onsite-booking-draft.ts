import { z } from "zod";

import { bookingSchema } from "@/lib/schemas";

const ONSITE_BOOKING_DRAFT_KEY = "stabs.onsite-booking-draft";

export const onsiteBookingDraftSchema = z.object({
  payload: bookingSchema,
  destinationTitle: z.string().min(1),
  locationText: z.string().min(1),
  serviceTitle: z.string().min(1),
  totalAmount: z.number().int().positive()
});

export type OnsiteBookingDraft = z.infer<typeof onsiteBookingDraftSchema>;

export function writeOnsiteBookingDraft(draft: OnsiteBookingDraft) {
  const parsed = onsiteBookingDraftSchema.parse(draft);
  window.sessionStorage.setItem(ONSITE_BOOKING_DRAFT_KEY, JSON.stringify(parsed));
}

export function readOnsiteBookingDraft() {
  const raw = window.sessionStorage.getItem(ONSITE_BOOKING_DRAFT_KEY);
  if (!raw) return null;

  try {
    const parsed = onsiteBookingDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearOnsiteBookingDraft() {
  window.sessionStorage.removeItem(ONSITE_BOOKING_DRAFT_KEY);
}
