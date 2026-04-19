import { checkoutDraftSchema } from "@/lib/schemas";

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
  serviceId: string;
  serviceSnapshot: {
    id: string;
    title: string;
    description: string | null;
    price_amount: number;
    service_type: string;
  };
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
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
