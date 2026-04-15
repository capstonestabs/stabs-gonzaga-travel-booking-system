import type { ListingCategory } from "@/lib/types";

export const SERVICE_TYPE_MAX_LENGTH = 40;

const LEGACY_SERVICE_TYPES = new Set(["standard", "package", "discounted"]);

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
