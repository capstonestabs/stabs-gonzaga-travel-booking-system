import type { Booking, ListingCategory } from "@/lib/types";

export interface TouristDashboardStats {
  totalSpent: number;
  totalSpentLastMonth: number;
  totalSpentThisMonth: number;
  spentChangePercent: number | null;
  totalBookings: number;
  destinationsVisited: number;
  upcomingTripsCount: number;
}

export interface TouristSpendPoint {
  label: string;
  amount: number;
}

export interface TouristCategoryBreakdown {
  category: ListingCategory;
  label: string;
  count: number;
  percentage: number;
}

export interface TouristTopDestination {
  destinationId: string;
  title: string;
  coverUrl: string | null;
  count: number;
  percentage: number;
}

export interface TouristAlertItem {
  type: "payment" | "upcoming";
  booking: Booking;
  daysUntil: number;
  isToday: boolean;
  coverUrl: string | null;
  serviceImageUrl: string | null;
}

export interface TouristFeedbackPrompt {
  destinationId: string;
  destinationSlug: string | null;
  title: string;
  coverUrl: string | null;
  serviceTitle: string | null;
  serviceImageUrl: string | null;
  completedAt: string | null;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function isCompleted(booking: Booking) {
  return booking.status === "completed";
}

function isUpcoming(booking: Booking) {
  if (booking.status !== "confirmed") return false;
  return new Date(booking.service_date) >= new Date(new Date().toDateString());
}

function daysUntilDate(dateString: string): number {
  const today = new Date(new Date().toDateString());
  const target = new Date(new Date(dateString).toDateString());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getBookingServiceImage(booking: Booking): string | null {
  if (!booking.service_id || !booking.destination?.destination_services) {
    return null;
  }
  const matchedService = booking.destination.destination_services.find(
    (service) => service.id === booking.service_id
  );
  return matchedService?.image_url ?? null;
}

export function getTouristDashboardStats(bookings: Booking[]): TouristDashboardStats {
  const completedBookings = bookings.filter(isCompleted);

  const totalSpent = completedBookings.reduce((sum, b) => sum + Number(b.total_amount ?? 0), 0);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  function spendInRange(from: Date, to?: Date) {
    return completedBookings
      .filter((b) => {
        const date = new Date(b.completed_at ?? b.service_date);
        return date >= from && (!to || date <= to);
      })
      .reduce((sum, b) => sum + Number(b.total_amount ?? 0), 0);
  }

  const totalSpentThisMonth = spendInRange(thisMonthStart);
  const totalSpentLastMonth = spendInRange(lastMonthStart, lastMonthEnd);

  const spentChangePercent =
    totalSpentLastMonth > 0
      ? ((totalSpentThisMonth - totalSpentLastMonth) / totalSpentLastMonth) * 100
      : totalSpentThisMonth > 0
        ? 100
        : null;

  const destinationsVisited = new Set(completedBookings.map((b) => b.destination_id)).size;
  const upcomingTripsCount = bookings.filter(isUpcoming).length;

  return {
    totalSpent,
    totalSpentLastMonth,
    totalSpentThisMonth,
    spentChangePercent,
    totalBookings: bookings.length,
    destinationsVisited,
    upcomingTripsCount
  };
}

export function getTouristNextTrip(bookings: Booking[]): Booking | null {
  const upcoming = bookings
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.service_date).getTime() - new Date(b.service_date).getTime());

  return upcoming[0] ?? null;
}

export function getTouristSpendingTrend(
  bookings: Booking[],
  monthsBack: 1 | 6 | 12 = 12
): TouristSpendPoint[] {
  const completedBookings = bookings.filter(isCompleted);
  const now = new Date();
  const points: TouristSpendPoint[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

    const amount = completedBookings
      .filter((b) => {
        const date = new Date(b.completed_at ?? b.service_date);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, b) => sum + Number(b.total_amount ?? 0), 0);

    points.push({
      label: MONTH_LABELS[monthDate.getMonth()],
      amount
    });
  }

  return points;
}

export function getTouristCategoryBreakdown(bookings: Booking[]): TouristCategoryBreakdown[] {
  const relevantBookings = bookings.filter((b) => b.status !== "cancelled");
  const total = relevantBookings.length;

  if (total === 0) return [];

  const counts = new Map<ListingCategory, number>();
  for (const booking of relevantBookings) {
    const category = booking.destination_snapshot.category;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const labels: Record<ListingCategory, string> = {
    tour: "Tours",
    stay: "Stays"
  };

  return Array.from(counts.entries())
    .map(([category, count]) => ({
      category,
      label: labels[category] ?? category,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count);
}

export function getTouristTopDestinations(bookings: Booking[], limit = 5): TouristTopDestination[] {
  const relevantBookings = bookings.filter((b) => b.status !== "cancelled");
  const total = relevantBookings.length;

  if (total === 0) return [];

  const counts = new Map<string, { title: string; coverUrl: string | null; count: number }>();
  for (const booking of relevantBookings) {
    const existing = counts.get(booking.destination_id);
    if (existing) {
      existing.count += 1;
      if (!existing.coverUrl && booking.destination?.cover_url) {
        existing.coverUrl = booking.destination.cover_url;
      }
    } else {
      counts.set(booking.destination_id, {
        title: booking.destination_snapshot.title,
        coverUrl: booking.destination?.cover_url ?? null,
        count: 1
      });
    }
  }

  return Array.from(counts.entries())
    .map(([destinationId, entry]) => ({
      destinationId,
      title: entry.title,
      coverUrl: entry.coverUrl,
      count: entry.count,
      percentage: Math.round((entry.count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getTouristActionAlerts(
  bookings: Booking[],
  upcomingWithinDays = 3
): TouristAlertItem[] {
  const paymentAlerts: TouristAlertItem[] = bookings
    .filter((b) => b.status === "pending_payment")
    .map((booking) => {
      const daysUntil = daysUntilDate(booking.service_date);
      return {
        type: "payment" as const,
        booking,
        daysUntil,
        isToday: daysUntil === 0,
        coverUrl: booking.destination?.cover_url ?? null,
        serviceImageUrl: getBookingServiceImage(booking)
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const upcomingAlerts: TouristAlertItem[] = bookings
    .filter((b) => b.status === "confirmed")
    .map((booking) => {
      const daysUntil = daysUntilDate(booking.service_date);
      return {
        type: "upcoming" as const,
        booking,
        daysUntil,
        isToday: daysUntil === 0,
        coverUrl: booking.destination?.cover_url ?? null,
        serviceImageUrl: getBookingServiceImage(booking)
      };
    })
    .filter((entry) => entry.daysUntil >= 0 && entry.daysUntil <= upcomingWithinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return [...paymentAlerts, ...upcomingAlerts];
}

export function getTouristFeedbackPrompts(bookings: Booking[], limit = 3): TouristFeedbackPrompt[] {
  const completedBookings = bookings
    .filter((b) => b.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.service_date).getTime() -
        new Date(a.completed_at ?? a.service_date).getTime()
    );

  const seen = new Set<string>();
  const prompts: TouristFeedbackPrompt[] = [];

  for (const booking of completedBookings) {
    if (seen.has(booking.destination_id)) continue;
    seen.add(booking.destination_id);

    prompts.push({
      destinationId: booking.destination_id,
      destinationSlug: booking.destination?.slug ?? null,
      title: booking.destination_snapshot.title,
      coverUrl: booking.destination?.cover_url ?? null,
      serviceTitle: booking.service_snapshot?.title ?? null,
      serviceImageUrl: getBookingServiceImage(booking),
      completedAt: booking.completed_at
    });

    if (prompts.length >= limit) break;
  }

  return prompts;
}

export function getTouristRecentBookings(bookings: Booking[], limit = 5): Booking[] {
  return [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}