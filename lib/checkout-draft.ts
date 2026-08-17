import { checkoutDraftSchema } from "@/lib/schemas";
import type { GuestType } from "@/lib/guest-pricing";

const CHECKOUT_DRAFT_KEY = "stabs.checkout-draft";

export interface CheckoutDraft {
  destinationId: string;
  destinationSlug: string;
  destinationTitle: string;
  locationText: string;
  category: "tour" | "stay";
  priceAmount: number;
  serviceDate: string;
  guestCount: number;
  guestTypes?: GuestType[];
  guestDetails?: Array<{ name: string; type: GuestType }>;
  guestPricing?: {
    adult: { label: string; priceAmount: number };
    child: { label: string; priceAmount: number };
  };
  serviceId: string;
  serviceSnapshot: {
    id: string;
    title: string;
    description: string | null;
    price_amount: number;
    service_type: string;
    additional_services?: Array<{
      id: string;
      title: string;
      price_amount: number;
      quantity: number;
      subtotal: number;
    }>;
  };
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  policies?: string[];
  additionalServices?: Array<{
    id: string;
    quantity: number;
  }>;
}

export function readCheckoutDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(CHECKOUT_DRAFT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = checkoutDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as CheckoutDraft) : null;
  } catch {
    return null;
  }
}

export function writeCheckoutDraft(draft: CheckoutDraft) {
  const parsed = checkoutDraftSchema.parse(draft);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(parsed));
  }
}

export function clearCheckoutDraft() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CHECKOUT_DRAFT_KEY);
  }
}
