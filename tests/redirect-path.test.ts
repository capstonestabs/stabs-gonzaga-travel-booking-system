import { getSafeRedirectPath } from "@/lib/utils";

describe("getSafeRedirectPath", () => {
  it("allows internal application paths", () => {
    expect(getSafeRedirectPath("/checkout/continue", "/dashboard")).toBe(
      "/checkout/continue"
    );
  });

  it("rejects external or malformed redirects", () => {
    expect(getSafeRedirectPath("https://example.com", "/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("//evil.test", "/dashboard")).toBe("/dashboard");
    expect(getSafeRedirectPath("account", "/dashboard")).toBe("/dashboard");
  });
});
