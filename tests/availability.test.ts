import { findAvailabilityWindowConflict, getAvailabilityState } from "@/lib/availability";

describe("findAvailabilityWindowConflict", () => {
  it("detects overlapping date windows", () => {
    const conflict = findAvailabilityWindowConflict([
      { startDate: "2026-03-10", endDate: "2026-03-15" },
      { startDate: "2026-03-14", endDate: "2026-03-20" }
    ]);

    expect(conflict).not.toBeNull();
    expect(conflict?.previous.startDate).toBe("2026-03-10");
    expect(conflict?.current.startDate).toBe("2026-03-14");
  });

  it("returns null when windows are separate", () => {
    expect(
      findAvailabilityWindowConflict([
        { startDate: "2026-03-10", endDate: "2026-03-12" },
        { startDate: "2026-03-13", endDate: "2026-03-18" }
      ])
    ).toBeNull();
  });
});

describe("getAvailabilityState", () => {
  it("returns a success state when enough slots remain", () => {
    const result = getAvailabilityState(
      {
        is_open: true,
        capacity: 10,
        confirmed_guests: 3,
        locked_guests: 2,
        remaining_guests: 5
      },
      4
    );

    expect(result.canBook).toBe(true);
    expect(result.tone).toBe("success");
  });

  it("returns a warning when requested guests exceed the remaining slots", () => {
    const result = getAvailabilityState(
      {
        is_open: true,
        capacity: 10,
        confirmed_guests: 7,
        locked_guests: 1,
        remaining_guests: 2
      },
      3
    );

    expect(result.canBook).toBe(false);
    expect(result.tone).toBe("warning");
  });
});
