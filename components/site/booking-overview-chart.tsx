"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { BookingActivityPoint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type Granularity = "daily" | "weekly";

const SERIES = [
  { key: "confirmed", label: "Confirmed", color: "hsl(var(--accent))" },
  { key: "pending", label: "Pending", color: "hsl(var(--warning))" },
  { key: "cancelled", label: "Cancelled", color: "hsl(var(--destructive))" }
] as const;

function toWeekly(points: BookingActivityPoint[]): BookingActivityPoint[] {
  const weeks: BookingActivityPoint[] = [];
  for (let i = 0; i < points.length; i += 7) {
    const chunk = points.slice(i, i + 7);
    if (chunk.length === 0) continue;
    weeks.push({
      date: chunk[0].date,
      label: chunk[0].label,
      confirmed: chunk.reduce((sum, p) => sum + p.confirmed, 0),
      pending: chunk.reduce((sum, p) => sum + p.pending, 0),
      cancelled: chunk.reduce((sum, p) => sum + p.cancelled, 0)
    });
  }
  return weeks;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[0.75rem] border border-border/70 bg-card px-3 py-2 shadow-[0_10px_24px_rgba(22,74,47,0.10)]">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <div className="mt-1 space-y-0.5">
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function BookingOverviewChart({ data }: { data: BookingActivityPoint[] }) {
  const [granularity, setGranularity] = useState<Granularity>("daily");

  const chartData = useMemo(
    () => (granularity === "weekly" ? toWeekly(data) : data),
    [data, granularity]
  );

  const hasData = data.some((point) => point.confirmed || point.pending || point.cancelled);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex w-full items-center justify-between gap-3 px-4 pb-1 pt-3.5">
        <CardTitle className="m-0">Booking Overview</CardTitle>

        <div className="flex shrink-0 items-center gap-1 rounded-[0.7rem] border border-border/70 bg-muted/40 p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-7 min-h-7 rounded-[0.55rem] px-2.5 text-xs font-medium ${
              granularity === "daily" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setGranularity("daily")}
          >
            Daily
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-7 min-h-7 rounded-[0.55rem] px-2.5 text-xs font-medium ${
              granularity === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setGranularity("weekly")}
          >
            Weekly
          </Button>
        </div>
      </div>

      <CardContent className="flex-1 space-y-1.5 p-4 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          {SERIES.map((series) => (
            <span
              key={series.key}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />
              {series.label}
            </span>
          ))}
        </div>

        {hasData ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  {SERIES.map((series) => (
                    <linearGradient key={series.key} id={`fill-${series.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={series.color} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={series.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} />
                {SERIES.map((series) => (
                  <Area
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={2}
                    fill={`url(#fill-${series.key})`}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-[0.9rem] border border-dashed border-border/70 text-sm text-muted-foreground">
            No booking activity in this period yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}