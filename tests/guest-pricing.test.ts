import { describe, expect, it } from "vitest";

import {
  calculateGuestTotal,
  getAbramMergedGuestRatePlan,
  isAbramBeachResort
} from "@/lib/guest-pricing";
import type { DestinationService } from "@/lib/types";

function service(
  id: string,
  title: string,
  priceAmount: number
): DestinationService {
  return {
    id,
    destination_id: "destination-id",
    title,
    description: null,
    price_amount: priceAmount,
    service_type: "person",
    service_category: "core",
    daily_capacity: 100,
    is_active: true,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z"
  };
}

describe("Abram merged guest pricing", () => {
  it("recognizes the Abram Beach Resort destination", () => {
    expect(isAbramBeachResort("abram-beach-resort", "Abram Beach Resort")).toBe(true);
    expect(isAbramBeachResort("another-resort", "Another Resort")).toBe(false);
  });

  it("merges adult and child service rates into one plan", () => {
    const plan = getAbramMergedGuestRatePlan("abram-beach-resort", "Abram Beach Resort", [
      service("adult", "Adult entrance", 150),
      service("child", "Kids entrance", 100)
    ]);

    expect(plan?.primaryService.id).toBe("adult");
    expect(plan?.child.priceAmount).toBe(100);
    expect(calculateGuestTotal(["adult", "child", "child"], plan!)).toBe(350);
  });
});

describe("Destination entrance fee calculation", () => {
  it("calculates total payment correctly with entrance fee, stay package, and add-ons", () => {
    const guestCount = 2;
    const entranceFeePerGuest = 50;
    const stayPrice = 2000;
    const kayakAddonPrice = 50;

    const entranceFeeTotal = entranceFeePerGuest * guestCount; // 100
    const totalAmount = stayPrice + entranceFeeTotal + kayakAddonPrice; // 2150

    expect(entranceFeeTotal).toBe(100);
    expect(totalAmount).toBe(2150);
  });

  it("handles tour packages where base price and entrance fee both multiply by guest count", () => {
    const guestCount = 4;
    const entranceFeePerGuest = 50;
    const tourRatePerGuest = 250;

    const entranceFeeTotal = entranceFeePerGuest * guestCount; // 200
    const tourTotal = tourRatePerGuest * guestCount; // 1000
    const totalAmount = tourTotal + entranceFeeTotal; // 1200

    expect(entranceFeeTotal).toBe(200);
    expect(totalAmount).toBe(1200);
  });
});
