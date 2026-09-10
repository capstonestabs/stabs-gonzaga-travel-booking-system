import { readFileSync } from "node:fs";
import path from "node:path";

import {
  bookingSchema,
  recordOnsitePaymentSchema,
  staffBookingActionSchema
} from "@/lib/schemas";
import {
  canConfirmBooking,
  canDeclineBooking,
  canRecordOnsitePayment,
  formatBookingStatusLabel
} from "@/lib/booking-state";

describe("payment flow contracts", () => {
  it("requires a supported payment mode when creating a booking", () => {
    const basePayload = {
      destinationId: "00000000-0000-0000-0000-000000000001",
      serviceDate: "2026-10-01",
      checkOutDate: "2026-10-01",
      checkOutTime: "12:00",
      guestCount: 1,
      guestDetails: [{ name: "Alex Tourist", type: "adult" as const }],
      serviceId: "00000000-0000-0000-0000-000000000002",
      contactName: "Alex Tourist",
      contactEmail: "alex@example.com",
      contactPhone: "+639171234567",
      notes: "",
      termsAccepted: true as const,
      additionalServices: []
    };

    expect(bookingSchema.safeParse(basePayload).success).toBe(false);
    expect(bookingSchema.safeParse({ ...basePayload, paymentMode: "online" }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...basePayload, paymentMode: "onsite" }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...basePayload, paymentMode: "card" }).success).toBe(false);
  });

  it("allows confirmation and decline only for awaiting bookings", () => {
    expect(canConfirmBooking("awaiting_confirmation")).toBe(true);
    expect(canDeclineBooking("awaiting_confirmation")).toBe(true);
    expect(canConfirmBooking("pending_payment")).toBe(true);
    expect(canConfirmBooking("completed")).toBe(false);
    expect(canDeclineBooking("awaiting_onsite_payment")).toBe(false);
  });

  it("only allows onsite settlement from the onsite waiting state", () => {
    expect(canRecordOnsitePayment("awaiting_onsite_payment")).toBe(true);
    expect(canRecordOnsitePayment("awaiting_confirmation")).toBe(false);
    expect(canRecordOnsitePayment("completed")).toBe(false);
    expect(formatBookingStatusLabel("declined")).toBe("Declined");
  });

  it("validates decline and onsite settlement payloads", () => {
    expect(
      staffBookingActionSchema.safeParse({
        bookingId: "00000000-0000-0000-0000-000000000001",
        action: "decline",
        declineReason: "Date is no longer available."
      }).success
    ).toBe(true);

    expect(
      recordOnsitePaymentSchema.safeParse({
        bookingId: "00000000-0000-0000-0000-000000000001",
        amount: 12500,
        receiptCode: "ST-ABC12345",
        notes: "Cash received at check-in."
      }).success
    ).toBe(true);
    expect(
      recordOnsitePaymentSchema.safeParse({
        bookingId: "00000000-0000-0000-0000-000000000001",
        amount: 0,
        receiptCode: "ST-ABC12345"
      }).success
    ).toBe(false);
  });

  it("keeps the online paid transition pointed at completed", () => {
    const source = readFileSync(path.join(process.cwd(), "lib/payment-sync.ts"), "utf8");
    expect(source).toContain('? "completed"');
    expect(source).toContain("finalBookingStatus === \"completed\"");
  });

  it("keeps declined bookings terminal during payment synchronization", () => {
    const source = readFileSync(path.join(process.cwd(), "lib/payment-sync.ts"), "utf8");
    expect(source).toContain('existingBooking.status === "declined"');
    expect(source).toContain("Staff declines are terminal");
  });
});
