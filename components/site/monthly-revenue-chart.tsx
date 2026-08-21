"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MonthlyRevenuePoint } from "@/lib/types";

function formatPesoCompact(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₱${Math.round(value / 1000)}K`;
  return `₱${value}`;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value as number;
  return (
    <div className="rounded-[0.75rem] border border-border/70 bg-card px-3 py-2 shadow-[0_10px_24px_rgba(22,74,47,0.10)]">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Revenue: <span className="font-semibold text-foreground">{formatPesoCompact(value)}</span>
      </p>
    </div>
  );
}

export function MonthlyRevenueChart({ data }: { data: MonthlyRevenuePoint[] }) {
  const hasData = data.some((point) => point.revenue > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[0.9rem] border border-dashed border-border/70 text-sm text-muted-foreground">
        No revenue recorded in this period yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatPesoCompact}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
          <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}