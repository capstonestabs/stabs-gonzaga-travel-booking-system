export const WEEKDAYS = [
  { value: 1, shortLabel: "Mon", label: "Monday" },
  { value: 2, shortLabel: "Tue", label: "Tuesday" },
  { value: 3, shortLabel: "Wed", label: "Wednesday" },
  { value: 4, shortLabel: "Thu", label: "Thursday" },
  { value: 5, shortLabel: "Fri", label: "Friday" },
  { value: 6, shortLabel: "Sat", label: "Saturday" },
  { value: 7, shortLabel: "Sun", label: "Sunday" }
] as const;

export const DEFAULT_OPEN_WEEKDAYS: number[] = WEEKDAYS.map((day) => day.value);

export function normalizeOpenWeekdays(value?: number[] | null): number[] {
  const selected = new Set((value ?? DEFAULT_OPEN_WEEKDAYS).filter((day) => day >= 1 && day <= 7));
  return WEEKDAYS.map((day) => day.value).filter((day) => selected.has(day));
}

export function formatOpenWeekdays(value?: number[] | null) {
  const days = normalizeOpenWeekdays(value);
  if (days.length === 7) return "Every day";
  if (days.join(",") === "1,2,3,4,5") return "Weekdays";
  if (days.join(",") === "6,7") return "Weekends";
  return WEEKDAYS.filter((day) => days.includes(day.value)).map((day) => day.shortLabel).join(", ");
}

export function formatOperatingTime(value?: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function getIsoWeekday(dateKey: string) {
  const day = new Date(`${dateKey}T12:00:00`).getDay();
  return day === 0 ? 7 : day;
}
