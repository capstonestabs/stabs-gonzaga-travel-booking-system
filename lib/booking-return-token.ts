import { createHmac, timingSafeEqual } from "crypto";

import { env } from "@/lib/env";

function getReturnTokenSecret() {
  return env.paymongoSecretKey || env.supabaseServiceRoleKey || "stabs-booking-return";
}

export function createBookingReturnToken(bookingId: string) {
  return createHmac("sha256", getReturnTokenSecret()).update(bookingId).digest("hex");
}

export function verifyBookingReturnToken(bookingId: string, token?: string | null) {
  if (!token) {
    return false;
  }

  const expected = createBookingReturnToken(bookingId);

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
