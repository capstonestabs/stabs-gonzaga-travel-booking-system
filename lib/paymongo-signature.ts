import crypto from "node:crypto";

interface ParsedSignature {
  timestamp: string;
  testSignature: string;
  liveSignature: string;
}

export function parsePaymongoSignatureHeader(header: string): ParsedSignature | null {
  const parts = header.split(",").map((part) => part.trim());
  const map = new Map(parts.map((part) => part.split("=") as [string, string]));

  const timestamp = map.get("t");
  const testSignature = map.get("te");
  const liveSignature = map.get("li");

  if (!timestamp || !testSignature || !liveSignature) {
    return null;
  }

  return { timestamp, testSignature, liveSignature };
}

export function computePaymongoSignature(payload: string, timestamp: string, secret: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
}

export function verifyPaymongoSignature(options: {
  header: string | null;
  payload: string;
  secret: string;
  livemode: boolean;
}) {
  if (!options.header) {
    return false;
  }

  const parsed = parsePaymongoSignatureHeader(options.header);
  if (!parsed) {
    return false;
  }

  const expected = computePaymongoSignature(
    options.payload,
    parsed.timestamp,
    options.secret
  );

  const received = options.livemode ? parsed.liveSignature : parsed.testSignature;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}
