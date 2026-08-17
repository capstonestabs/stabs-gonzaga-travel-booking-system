import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  Users
} from "lucide-react";

import { BookingServiceBrowser } from "@/components/forms/booking-service-browser";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserContext } from "@/lib/auth";
import { getDestinationBySlug } from "@/lib/repositories";

export default async function DestinationBookingPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ serviceId?: string }>;
}) {
  const { slug } = await params;
  const { serviceId } = await searchParams;
  const destination = await getDestinationBySlug(slug);

  if (!destination) {
    notFound();
  }

  const viewer = await getCurrentUserContext();
  const activeServices = (destination.destination_services ?? []).filter(
    (service) => service.is_active
  );
  const selectedServiceId = activeServices.some((service) => service.id === serviceId)
    ? serviceId
    : activeServices[0]?.id;

  return (
    <div className="page-shell space-y-4 py-4 pb-14 sm:space-y-6 sm:py-8">
      <Link
        href={`/listings/${destination.slug}` as Route}
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {destination.title}
      </Link>

      <header className="grid gap-3 lg:grid-cols-[minmax(0,1fr),auto] lg:items-end">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">Secure booking</Badge>
            <Badge variant="muted">
              {activeServices.length} active service{activeServices.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <h1 className="page-title mt-3">Book {destination.title}</h1>
          <p className="page-intro mt-2 hidden sm:block">
            Choose an active service, select your preferred date, add every guest, and review the
            reservation before secure payment.
          </p>
        </div>
        <div className="hidden items-start gap-2 rounded-[1rem] border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground shadow-[0_8px_22px_rgba(22,74,47,0.05)] md:inline-flex">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="max-w-sm">{destination.location_text}</span>
        </div>
      </header>

      <ol className="grid grid-cols-4 gap-1 rounded-[1rem] border border-border/70 bg-card p-2 shadow-[0_8px_24px_rgba(22,74,47,0.05)] sm:gap-2 sm:p-3">
        {[
          { label: "Date selection", icon: CalendarDays },
          { label: "Guest information", icon: Users },
          { label: "Payment", icon: CreditCard },
          { label: "Confirmation", icon: CheckCircle2 }
        ].map(({ label, icon: Icon }, index) => (
          <li
            key={label}
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[0.8rem] px-1 py-2 text-center text-[10px] font-semibold sm:flex-row sm:gap-2.5 sm:px-3 sm:py-2.5 sm:text-xs ${
              index === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <span
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-7 sm:w-7 ${
                index === 0 ? "bg-white/15" : "bg-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="truncate">{label}</span>
          </li>
        ))}
      </ol>

      {destination.booking_type === "walk-in" ? (
        <Card>
          <CardContent className="space-y-4 p-5 sm:p-7">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-secondary text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">This destination accepts walk-in arrangements</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Online payment is not enabled for this destination. Contact the assigned destination
                team before visiting.
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <p><span className="font-semibold">Email:</span> {destination.staff_profile?.contact_email || "Not provided"}</p>
              <p><span className="font-semibold">Phone:</span> {destination.staff_profile?.contact_phone || "Not provided"}</p>
            </div>
            <Link href={`/listings/${destination.slug}#location` as Route} className={buttonVariants()}>
              View destination location
            </Link>
          </CardContent>
        </Card>
      ) : activeServices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm leading-7 text-muted-foreground">
            No active services are available for booking right now. Please return to the destination
            page and try again later.
          </CardContent>
        </Card>
      ) : (
        <BookingServiceBrowser
          destinationId={destination.id}
          destinationSlug={destination.slug}
          destinationTitle={destination.title}
          locationText={destination.location_text}
          category={destination.category}
          services={destination.destination_services ?? []}
          coverUrl={destination.cover_url}
          initialServiceId={selectedServiceId}
          viewerRole={viewer?.role}
          defaultContactName={viewer?.profile?.full_name ?? ""}
          defaultContactEmail={viewer?.email ?? ""}
          defaultContactPhone={viewer?.profile?.phone ?? ""}
          policies={destination.policies}
        />
      )}
    </div>
  );
}
