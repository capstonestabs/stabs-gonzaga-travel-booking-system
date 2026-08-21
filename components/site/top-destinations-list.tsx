import type { DestinationRevenueSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function TopDestinationsList({ destinations }: { destinations: DestinationRevenueSummary[] }) {
  const top = destinations.slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-[0.9rem] border border-dashed border-border/70 text-sm text-muted-foreground">
        No destination revenue yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] text-sm">
        <thead>
          <tr className="border-b border-border/70 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <th className="px-2 py-1.5 text-left">Destination</th>
            <th className="px-2 py-1.5 text-center">Total bookings</th>
            <th className="px-2 py-1.5 text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {top.map((destination) => (
            <tr
              key={destination.destination_id}
              className="border-b border-border/50 last:border-0 hover:bg-muted/30"
            >
              <td className="px-2 py-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  {destination.cover_url ? (
                    <img
                      src={destination.cover_url}
                      alt={destination.destination_title}
                      className="h-8 w-8 shrink-0 rounded-[0.55rem] object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.55rem] bg-muted text-xs font-semibold text-muted-foreground">
                      {destination.destination_title.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <p className="truncate text-sm font-medium text-foreground">
                    {destination.destination_title}
                  </p>
                </div>
              </td>
              <td className="px-2 py-2 text-center text-muted-foreground">
                {destination.booking_count}
              </td>
              <td className="px-2 py-2 text-right font-semibold text-foreground">
                {formatCurrency(destination.total_paid_amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}