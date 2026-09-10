function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

export function getBookingDayCount(serviceDate: string, checkOutDate: string) {
  const difference = parseDateKey(checkOutDate) - parseDateKey(serviceDate);
  return Math.max(1, Math.round(difference / (24 * 60 * 60 * 1000)));
}

export function calculateDailyServiceTotal(
  dailyAmountInCentavos: number,
  serviceDate: string,
  checkOutDate: string
) {
  return dailyAmountInCentavos * getBookingDayCount(serviceDate, checkOutDate);
}
