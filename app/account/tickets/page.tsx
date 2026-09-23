import { redirect } from "next/navigation";
import type { Route } from "next";
import { getCurrentUserContext } from "@/lib/auth";
import { getBookingsForUser } from "@/lib/repositories";
import { getTouristTicketBookings } from "@/lib/tourist-bookings";
import { TouristTicketsClient } from "./TouristTicketsClient";

export default async function TouristTicketsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUserContext();
  if (!user) {
    redirect("/sign-in");
  }

  if (user.role !== "user") {
    redirect((user.role === "admin" ? "/admin" : "/staff") as Route);
  }

  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || "1", 10));

  const bookings = await getBookingsForUser(user.authUserId);
  const ticketBookings = getTouristTicketBookings(bookings);

  return <TouristTicketsClient initialBookings={ticketBookings} initialPage={currentPage} />;
}