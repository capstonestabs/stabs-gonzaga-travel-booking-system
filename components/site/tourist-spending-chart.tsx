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

import type { TouristSpendPoint } from "@/lib/tourist-dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type RangeOption = 1 | 6 | 12;

const RANGE_OPTIONS: { value: RangeOption; label: string }[] = [
  { value: 12, label: "1Y" },
  { value: 6, label: "6M" },
  { value: 1, label: "1M" }
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[0.75rem] border border-border/70 bg-card px-3 py-2 shadow-[0_10px_24px_rgba(22,74,47,0.10)]">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Spent: <span className="font-semibold text-foreground">{formatCurrency(payload[0].value)}</span>
      </p>
    </div>
  );
}

export function TouristSpendingChart({ data }: { data: TouristSpendPoint[] }) {
  const [range, setRange] = useState<RangeOption>(12);

  const chartData = useMemo(() => data.slice(data.length - range), [data, range]);
  const hasData = chartData.some((point) => point.amount > 0);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex w-full items-center justify-between gap-3 px-4 pb-1 pt-3.5">
        <div>
          <CardTitle className="m-0">Spending Trend</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">Your trip spending over time</p>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-[0.7rem] border border-border/70 bg-muted/40 p-1">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              size="sm"
              className={`h-7 min-h-7 rounded-[0.55rem] px-2.5 text-xs font-medium ${
                range === option.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <CardContent className="flex-1 p-4 pt-1">
        {hasData ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill-spend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
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
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Spent"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#fill-spend)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-[0.9rem] border border-dashed border-border/70 text-sm text-muted-foreground">
            No completed trips in this period yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}