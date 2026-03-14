import { randomInt } from "crypto";

import { hasSupabaseServiceEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ticketAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateTicketCode() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  let suffix = "";

  for (let index = 0; index < 6; index += 1) {
    suffix += ticketAlphabet[randomInt(0, ticketAlphabet.length)];
  }

  return `GTB-${stamp}-${suffix}`;
}

async function createUniqueTicketCode() {
  const supabase = createAdminSupabaseClient();

  while (true) {
    const ticketCode = generateTicketCode();
    const { data, error } = await supabase
      .from("bookings")
      .select("id")
      .eq("ticket_code", ticketCode)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return ticketCode;
    }
  }
}

export async function ensureBookingTicketCode(bookingId: string, existingCode?: string | null) {
  if (existingCode) {
    return existingCode;
  }

  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const supabase = createAdminSupabaseClient();
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("ticket_code")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  if (booking?.ticket_code) {
    return booking.ticket_code;
  }

  const ticketCode = await createUniqueTicketCode();
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ ticket_code: ticketCode })
    .eq("id", bookingId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return ticketCode;
}
