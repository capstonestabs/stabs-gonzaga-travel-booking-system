import type { DestinationService, ListingCategory } from "@/lib/types";

export const SERVICE_TYPE_MAX_LENGTH = 40;

const LEGACY_SERVICE_TYPES = new Set(["standard", "package", "discounted"]);

export type ServiceCategoryType = "core" | "additional";

export function getServiceCategory(service: Partial<DestinationService>): ServiceCategoryType {
  if (service?.service_category === "additional" || service?.service_category === "core") {
    return service.service_category === "additional" ? "additional" : "core";
  }
  const text = `${service.title ?? ""} ${service.description ?? ""} ${service.service_type ?? ""}`.toLowerCase();
  if (
    text.includes("zipline") ||
    text.includes("paddle") ||
    text.includes("snorkel") ||
    text.includes("vest") ||
    text.includes("kayak") ||
    text.includes("atv") ||
    text.includes("rent") ||
    text.includes("ride") ||
    text.includes("boat") ||
    text.includes("activity") ||
    text.includes("add-on") ||
    text.includes("addon") ||
    text.includes("additional") ||
    text.includes("equipment") ||
    text.includes("extra")
  ) {
    return "additional";
  }
  return "core";
}

export function getEntranceFeeAmount(): number {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("stabs_configured_entrance_fee");
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num) && num >= 0) return num;
    }
  }
  return 50;
}

export function getDefaultServiceTypeLabel(category?: ListingCategory | null) {
  return category === "stay" ? "stay" : "person";
}

export function normalizeServiceTypeLabel(
  value?: string | null,
  category?: ListingCategory | null
) {
  const normalizedValue =
    typeof value === "string" ? value.trim().replace(/^\/+/, "").replace(/\s+/g, " ") : "";

  if (!normalizedValue) {
    return getDefaultServiceTypeLabel(category);
  }

  if (LEGACY_SERVICE_TYPES.has(normalizedValue.toLowerCase())) {
    return getDefaultServiceTypeLabel(category);
  }

  return normalizedValue;
}

export function formatServiceTypeLabel(
  value?: string | null,
  options?: {
    category?: ListingCategory | null;
    includeSlash?: boolean;
  }
) {
  const label = normalizeServiceTypeLabel(value, options?.category);
  return options?.includeSlash ? `/${label}` : label;
}
