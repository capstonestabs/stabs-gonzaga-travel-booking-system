import { redirect } from "next/navigation";

export default async function PrintableBookingsPage() {
  redirect("/account/tickets");
}
