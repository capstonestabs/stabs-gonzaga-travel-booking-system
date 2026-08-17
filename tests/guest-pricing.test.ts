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
