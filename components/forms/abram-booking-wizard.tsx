"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheckBig,
  CreditCard,
  Mail,
  Phone,
  Plus,
  Trash2,
  UserRound,
  Users
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvailabilityCalendarPanel } from "@/components/forms/availability-calendar-panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { writeCheckoutDraft } from "@/lib/checkout-draft";
import {
  calculateGuestTotal,
  type GuestType,
  type MergedGuestRatePlan
} from "@/lib/guest-pricing";
import type { AvailabilitySnapshot, ListingCategory, UserRole } from "@/lib/types";
import { formatPesoCurrency, pesoAmountToCentavos } from "@/lib/utils";

interface GuestEntry {
  id: number;
  type: GuestType;
  name: string;
}

const steps = [
  { number: 1, label: "Date", icon: CalendarDays },
  { number: 2, label: "Guest information", icon: Users },
  { number: 3, label: "Payment", icon: CreditCard },
  { number: 4, label: "Confirmation", icon: CircleCheckBig }
];

export function AbramBookingWizard({
  destinationId,
  destinationSlug,
  destinationTitle,
  locationText,
  category,
  ratePlan,
  viewerRole,
  defaultContactName,
  defaultContactEmail,
  defaultContactPhone,
  policies = []
}: {
  destinationId: string;
  destinationSlug: string;
  destinationTitle: string;
  locationText: string;
  category: ListingCategory;
  ratePlan: MergedGuestRatePlan;
  viewerRole?: UserRole | null;
  defaultContactName?: string;
  defaultContactEmail?: string;
  defaultContactPhone?: string;
  policies?: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [serviceDate, setServiceDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [availability, setAvailability] = useState<AvailabilitySnapshot | null>(null);
  const [guests, setGuests] = useState<GuestEntry[]>([
    { id: 1, type: "adult", name: defaultContactName ?? "" }
  ]);
  const [nextGuestId, setNextGuestId] = useState(2);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guestTypes = guests.map((guest) => guest.type);
  const adultCount = guestTypes.filter((type) => type === "adult").length;
  const childCount = guestTypes.length - adultCount;
  const totalAmount = useMemo(
    () => calculateGuestTotal(guestTypes, ratePlan),
    [guestTypes, ratePlan]
  );

  const grandTotalAmount = totalAmount;
  const canFitGuests = Boolean(
    availability?.is_open && guests.length <= availability.remaining_guests
  );

  async function checkSelectedDate() {
    if (!serviceDate) {
      setError("Select your preferred booking date first.");
      return;
    }

    if (!checkOutDate || !checkOutTime) {
      setError("Select a check-out date and time before continuing.");
      return;
    }

    setError(null);
    setIsChecking(true);

    try {
      const response = await fetch(
        `/api/destinations/${destinationId}/availability?serviceDate=${encodeURIComponent(serviceDate)}&serviceId=${encodeURIComponent(ratePlan.primaryService.id)}`,
        { cache: "no-store" }
      );
      const body = (await response.json()) as {
        error?: string;
        availability?: AvailabilitySnapshot | null;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to check this date.");
      }

      const snapshot = body.availability ?? null;
      setAvailability(snapshot);

      if (!snapshot?.is_open || snapshot.remaining_guests < 1) {
        throw new Error("This package is fully booked or closed on the selected date.");
      }

      setStep(2);
    } catch (dateError) {
      setError(dateError instanceof Error ? dateError.message : "Unable to check this date.");
    } finally {
      setIsChecking(false);
    }
  }

  function addGuest() {
    if (availability && guests.length >= availability.remaining_guests) {
      setError(`Only ${availability.remaining_guests} guest slots remain for this date.`);
      return;
    }

    setGuests((current) => [...current, { id: nextGuestId, type: "adult", name: "" }]);
    setNextGuestId((current) => current + 1);
    setError(null);
  }

  function removeGuest(id: number) {
    if (guests.length === 1) {
      setError("A reservation must include at least one guest.");
      return;
    }

    setGuests((current) => current.filter((guest) => guest.id !== id));
    setError(null);
  }

  function updateGuestType(id: number, type: GuestType) {
    setGuests((current) =>
      current.map((guest) => (guest.id === id ? { ...guest, type } : guest))
    );
    setError(null);
  }

  function updateGuestName(id: number, name: string) {
    setGuests((current) =>
      current.map((guest) => (guest.id === id ? { ...guest, name } : guest))
    );
    setError(null);
  }

  function handleGuestDetailsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!availability?.is_open || !canFitGuests) {
      setError("The selected date does not have enough slots for all guests.");
      return;
    }

    if (viewerRole && viewerRole !== "user") {
      setError("Bookings can only be completed with a traveler account.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const contactName = String(formData.get("contactName") ?? "").trim();
    const contactEmail = String(formData.get("contactEmail") ?? "").trim();
    const contactPhone = String(formData.get("contactPhone") ?? "").trim();
    const guestDetails = guests.map((guest) => ({
      name: guest.name.trim(),
      type: guest.type
    }));

    if (guestDetails.some((guest) => guest.name.length < 2)) {
      setError("Enter the full name of every guest so each pass can be issued correctly.");
      return;
    }

    if (contactName.length < 2) {
      setError("Enter the full name for this reservation.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(contactEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (contactPhone.length < 7) {
      setError("Enter a valid mobile number.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      writeCheckoutDraft({
        destinationId,
        destinationSlug,
        destinationTitle,
        locationText,
        category,
        priceAmount: pesoAmountToCentavos(ratePlan.adult.priceAmount),
        serviceDate,
        checkOutDate,
        checkOutTime,
        guestCount: guests.length,
        guestTypes,
        guestDetails,
        guestPricing: {
          adult: {
            label: ratePlan.adult.title,
            priceAmount: pesoAmountToCentavos(ratePlan.adult.priceAmount)
          },
          child: {
            label: ratePlan.child.title,
            priceAmount: pesoAmountToCentavos(ratePlan.child.priceAmount)
          }
        },
        serviceId: ratePlan.primaryService.id,
        serviceSnapshot: {
          id: ratePlan.primaryService.id,
          title: ratePlan.title,
          description: "One reservation with Adult and Child guest rates.",
          price_amount: ratePlan.adult.priceAmount,
          service_type: "person",
          additional_services: []
        },
        contactName,
        contactEmail,
        contactPhone,
        notes: String(formData.get("notes") ?? "").trim(),
        policies,
        additionalServices: []
      });
      setStep(3);
      router.push("/checkout/continue" as Route);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the reservation.");
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-[30rem] items-center">
          {steps.map(({ number, label, icon: Icon }, index) => {
            const isActive = step === number;
            const isComplete = step > number;
            return (
              <li key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isComplete
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className={`whitespace-nowrap text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 ? <span className="mx-2 h-px flex-1 bg-border" /> : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-[1rem] border border-border/70 bg-muted/35 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">One reservation</p>
            <h4 className="mt-1 font-display text-xl font-semibold">{ratePlan.title}</h4>
          </div>
          <div className="text-right text-xs leading-5 text-muted-foreground">
            <p><span className="font-semibold text-foreground">{formatPesoCurrency(ratePlan.adult.priceAmount)}</span> / Adult</p>
            <p><span className="font-semibold text-foreground">{formatPesoCurrency(ratePlan.child.priceAmount)}</span> / Child</p>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Step 1: Select your preferred date</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Availability is checked only after you choose a date.
            </p>
          </div>
          <AvailabilityCalendarPanel
            destinationId={destinationId}
            serviceId={ratePlan.primaryService.id}
            selectedDate={serviceDate}
            onSelectDate={(nextDate) => {
                setServiceDate(nextDate);
                setCheckOutDate((current) => {
                  if (!current) {
                    return nextDate;
                  }
                  return current < nextDate ? nextDate : current;
                });
                setAvailability(null);
                setError(null);
            }}
          />
          <div className="rounded-[0.9rem] border border-border/70 bg-muted/30 px-3.5 py-3 text-sm">
            <span className="text-muted-foreground">Selected date: </span>
            <span className="font-semibold">{serviceDate || "Choose a date from the calendar"}</span>

            {serviceDate ? (
              <div className="mt-3 space-y-2.5 rounded-[0.85rem] border border-border/70 bg-background px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                  Select check-out date & time
                </p>
                  <div className="grid grid-cols-2 gap-2 min-w-0">
                    <label className="block min-w-0 space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Check-out date</span>
                      <Input
                        type="date"
                        className="min-w-0 w-full"
                        value={checkOutDate}
                        min={serviceDate}
                        onChange={(event) => {
                          setError(null);
                          setCheckOutDate(event.target.value);
                        }}
                        required
                      />
                    </label>
                    <label className="block min-w-0 space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">Check-out time</span>
                      <Input
                        type="time"
                        className="min-w-0 w-full"
                        value={checkOutTime}
                        onChange={(event) => {
                          setError(null);
                          setCheckOutTime(event.target.value);
                        }}
                        required
                      />
                    </label>
                  </div>
              </div>
            ) : null}
          </div>
          {error ? <p role="alert" className="rounded-[0.9rem] border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
          <Button
            className="w-full justify-between"
            disabled={isChecking || !serviceDate || !checkOutDate || !checkOutTime}
            onClick={() => void checkSelectedDate()}
          >
            {isChecking ? "Checking selected date..." : "Check date and continue"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <form onSubmit={handleGuestDetailsSubmit} className="space-y-5">
          <div className="flex items-start gap-3 rounded-[0.95rem] border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
            <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Your selected date is available.</p>
              <p className="mt-0.5 text-xs text-emerald-800">{availability?.remaining_guests ?? 0} guest slots remain for {serviceDate}.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Step 2: Add every guest</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Enter each name and choose Adult or Child. Each person receives a separate QR pass.</p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={addGuest}>
                <Plus className="h-4 w-4" /> Add guest
              </Button>
            </div>

            <div className="space-y-2.5">
              {guests.map((guest, index) => (
                <div key={guest.id} className="grid grid-cols-[auto,minmax(0,1fr),auto] items-start gap-3 rounded-[0.95rem] border border-border/70 bg-card p-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">{index + 1}</span>
                  <div className="min-w-0 space-y-2">
                    <label className="block">
                      <span className="sr-only">Guest {index + 1} full name</span>
                      <Input
                        value={guest.name}
                        onChange={(event) => updateGuestName(guest.id, event.target.value)}
                        placeholder={`Guest ${index + 1} full name`}
                        autoComplete="name"
                        required
                        minLength={2}
                      />
                    </label>
                    <label className="block">
                      <span className="sr-only">Guest {index + 1} type</span>
                    <select
                      value={guest.type}
                      onChange={(event) => updateGuestType(guest.id, event.target.value as GuestType)}
                      className="h-10 w-full rounded-[0.8rem] border border-input bg-card px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="adult">Adult — {formatPesoCurrency(ratePlan.adult.priceAmount)}</option>
                      <option value="child">Child — {formatPesoCurrency(ratePlan.child.priceAmount)}</option>
                    </select>
                    </label>
                  </div>
                  <button type="button" onClick={() => removeGuest(guest.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove guest ${index + 1}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-[1rem] border border-border/70 bg-muted/30 p-4 sm:grid-cols-3">
            <div><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Adults</p><p className="mt-1 font-semibold">{adultCount}</p></div>
            <div><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Children</p><p className="mt-1 font-semibold">{childCount}</p></div>
            <div className="sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Total</p>
              <p className="mt-1 font-display text-xl font-semibold text-primary">{formatPesoCurrency(grandTotalAmount)}</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/70 pt-5">
            <div>
              <p className="text-sm font-semibold">Reservation contact</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Required for confirmation and the official email receipt.</p>
            </div>
            <label className="block space-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium"><UserRound className="h-4 w-4 text-primary" /> Full name</span>
              <Input name="contactName" defaultValue={defaultContactName} autoComplete="name" required minLength={2} />
            </label>
            <label className="block space-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4 text-primary" /> Email address</span>
              <Input name="contactEmail" type="email" defaultValue={defaultContactEmail} autoComplete="email" required />
            </label>
            <label className="block space-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium"><Phone className="h-4 w-4 text-primary" /> Mobile number</span>
              <Input name="contactPhone" type="tel" defaultValue={defaultContactPhone} autoComplete="tel" required minLength={7} />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Notes <span className="font-normal text-muted-foreground">(optional)</span></span>
              <Textarea name="notes" placeholder="Arrival details or requests for resort staff" />
            </label>
          </div>

          {error ? <p role="alert" className="rounded-[0.9rem] border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

          <div className="grid gap-2.5 sm:grid-cols-[auto,1fr]">
            <Button type="button" variant="outline" onClick={() => { setStep(1); setError(null); }}>
              <ArrowLeft className="h-4 w-4" /> Change date
            </Button>
            <Button type="submit" className="justify-between" disabled={isSaving || !canFitGuests}>
              {isSaving ? "Preparing payment..." : "Review booking and payment"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <div className="rounded-[1rem] border border-border/70 bg-muted/35 p-4 text-sm text-muted-foreground">
          Opening the secure payment step…
        </div>
      ) : null}
    </div>
  );
}
