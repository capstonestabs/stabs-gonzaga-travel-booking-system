import {
  computePaymongoSignature,
  parsePaymongoSignatureHeader,
  verifyPaymongoSignature
} from "@/lib/paymongo-signature";

describe("PayMongo signature helpers", () => {
  it("parses the header format", () => {
    expect(parsePaymongoSignatureHeader("t=123,te=testsig,li=livesig")).toEqual({
      timestamp: "123",
      testSignature: "testsig",
      liveSignature: "livesig"
    });
  });

  it("verifies the test signature when livemode is false", () => {
    const payload = JSON.stringify({ hello: "world" });
    const timestamp = "1700000000";
    const secret = "whsec_demo";
    const signature = computePaymongoSignature(payload, timestamp, secret);

    expect(
      verifyPaymongoSignature({
        header: `t=${timestamp},te=${signature},li=deadbeef`,
        payload,
        secret,
        livemode: false
      })
    ).toBe(true);
  });
});
