import type { PricingBasis } from "@/lib/types";

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

export function getBookingDayCount(serviceDate: string, checkOutDate: string) {
  const difference = parseDateKey(checkOutDate) - parseDateKey(serviceDate);
  return Math.max(1, Math.round(difference / (24 * 60 * 60 * 1000)));
}

export function getBookingNightCount(serviceDate: string, checkOutDate: string) {
  const difference = parseDateKey(checkOutDate) - parseDateKey(serviceDate);
  const nights = Math.round(difference / (24 * 60 * 60 * 1000));
  return Math.max(0, nights);
}

export function calculateDailyServiceTotal(
  dailyAmountInCentavos: number,
  serviceDate: string,
  checkOutDate: string,
  pricingBasis: PricingBasis = "per_day"
) {
  if (pricingBasis === "per_night") {
    const nights = getBookingNightCount(serviceDate, checkOutDate);
    return dailyAmountInCentavos * nights;
  }
  const days = getBookingDayCount(serviceDate, checkOutDate);
  return dailyAmountInCentavos * days;
}
