import { BookingStatusCard } from "@/components/site/booking-status-card";

export default async function BookingStatusPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const { id } = await params;
  const { access } = await searchParams;

  return (
    <div className="page-shell flex justify-center py-8 sm:py-12">
      <BookingStatusCard bookingId={id} accessToken={access ?? null} />
    </div>
  );
}
