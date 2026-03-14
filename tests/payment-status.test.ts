import { mapPayMongoStatus } from "@/lib/paymongo";

describe("mapPayMongoStatus", () => {
  it("maps paid-like values to paid", () => {
    expect(mapPayMongoStatus("paid")).toBe("paid");
    expect(mapPayMongoStatus("succeeded")).toBe("paid");
  });

  it("maps unsettled or missing values to pending", () => {
    expect(mapPayMongoStatus("active")).toBe("pending");
    expect(mapPayMongoStatus(undefined)).toBe("pending");
  });
});
