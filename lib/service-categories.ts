import type { DestinationService } from "@/lib/types";

export function splitServicesByCategory(services: DestinationService[] | undefined | null) {
  const list = services ?? [];
  return {
    core: list.filter((service) => service.service_category !== "additional"),
    additional: list.filter((service) => service.service_category === "additional")
  };
}

export function getBookableServices(services: DestinationService[] | undefined | null) {
  return splitServicesByCategory(services).core;
}

export function getAdditionalServices(services: DestinationService[] | undefined | null) {
  return splitServicesByCategory(services).additional;
}