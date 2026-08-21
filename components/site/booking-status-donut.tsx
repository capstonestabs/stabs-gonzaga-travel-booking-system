"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { BookingStatusBreakdown } from "@/lib/types";

const SEGMENTS = [
  { key: "confirmed", label: "Confirmed", color: "hsl(var(--accent))" },
  { key: "pending", label: "Pending", color: "hsl(var(--warning))" },
  { key: "cancelled", label: "Cancelled", color: "hsl(var(--destructive))" }
] as const;

const RADIAN = Math.PI / 180;

function renderPercentLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!percent) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-[0.75rem] border border-border/70 bg-card px-3 py-2 shadow-[0_10px_24px_rgba(22,74,47,0.10)]">
      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.payload.color }} />
        {entry.name}: <span className="font-semibold">{entry.value}</span>
      </p>
    </div>
  );
}

export function BookingStatusDonut({ breakdown }: { breakdown: BookingStatusBreakdown }) {
  const data = useMemo(
    () =>
      SEGMENTS.map((segment) => ({
        key: segment.key,
        name: segment.label,
        value: breakdown[segment.key],
        color: segment.color
      })),
    [breakdown]
  );

  const hasData = breakdown.total > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="mx-auto h-48 w-48 shrink-0">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                strokeWidth={0}
                label={renderPercentLabel}
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-full border border-dashed border-border/70 text-center text-xs text-muted-foreground">
            No bookings yet
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3">
        {data.map((entry) => {
          const percent = breakdown.total > 0 ? (entry.value / breakdown.total) * 100 : 0;
          return (
            <div key={entry.key} className="text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="font-medium text-foreground">{entry.name}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {entry.value.toLocaleString()} ({percent.toFixed(1)}%)
              </p>
            </div>
          );
        })}
        <div className="mt-2 border-t border-border/70 pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total</p>
          <p className="font-display text-2xl font-semibold text-foreground">
            {breakdown.total.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}