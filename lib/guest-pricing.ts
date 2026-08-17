import type { DestinationService } from "@/lib/types";

export type GuestType = "adult" | "child";

export interface GuestRate {
  guestType: GuestType;
  serviceId: string;
  title: string;
  priceAmount: number;
}

export interface MergedGuestRatePlan {
  title: string;
  primaryService: DestinationService;
  adult: GuestRate;
  child: GuestRate;
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

export function isAbramBeachResort(slug: string, title: string) {
  const identity = normalize(`${slug} ${title}`);
  return identity.includes("abram") && identity.includes("beach") && identity.includes("resort");
}

function serviceIdentity(service: DestinationService) {
  return normalize(`${service.title} ${service.service_type} ${service.description ?? ""}`);
}

export function getAbramMergedGuestRatePlan(
  slug: string,
  title: string,
  services: DestinationService[]
): MergedGuestRatePlan | null {
  if (!isAbramBeachResort(slug, title)) {
    return null;
  }

  const activeServices = services.filter((service) => service.is_active);
  const adultService = activeServices.find((service) => {
    const identity = serviceIdentity(service);
    return /\badult\b/.test(identity);
  });
  const childService = activeServices.find((service) => {
    const identity = serviceIdentity(service);
    return /\b(child|children|kid|kids)\b/.test(identity);
  });

  if (!adultService || !childService) {
    return null;
  }

  return {
    title: "Beach resort admission",
    primaryService: adultService,
    adult: {
      guestType: "adult",
      serviceId: adultService.id,
      title: adultService.title,
      priceAmount: adultService.price_amount
    },
    child: {
      guestType: "child",
      serviceId: childService.id,
      title: childService.title,
      priceAmount: childService.price_amount
    }
  };
}

export function calculateGuestTotal(
  guestTypes: GuestType[],
  rates: Pick<MergedGuestRatePlan, "adult" | "child">
) {
  return guestTypes.reduce(
    (total, guestType) =>
      total + (guestType === "child" ? rates.child.priceAmount : rates.adult.priceAmount),
    0
  );
}
