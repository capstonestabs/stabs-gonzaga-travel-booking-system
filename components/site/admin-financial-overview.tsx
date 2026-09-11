"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { Banknote, CreditCard, Eye, Filter, Search, Wallet, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import type { FinancialRecord } from "@/lib/types";
import { formatBookingStatusLabel } from "@/lib/booking-state";
import { cn, formatCurrency, formatDateKey } from "@/lib/utils";

type PaymentTab = "online" | "onsite";
type StatusFilter = "all" | "settled" | "unsettled";

function paymentMode(record: FinancialRecord): PaymentTab {
  return record.payment_mode === "onsite" ? "onsite" : "online";
}

function modeLabel(mode: PaymentTab) {
  return mode === "onsite" ? "Onsite" : "Online";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function percentChange(records: FinancialRecord[], mode: PaymentTab) {
  if (records.length === 0) return null;
  const latest = Math.max(...records.map((record) => new Date(record.paid_at).getTime()));
  const currentStart = latest - 30 * 24 * 60 * 60 * 1000;
  const previousStart = currentStart - 30 * 24 * 60 * 60 * 1000;
  const current = records
    .filter((record) => paymentMode(record) === mode && new Date(record.paid_at).getTime() >= currentStart)
    .reduce((sum, record) => sum + record.amount, 0);
  const previous = records
    .filter((record) => {
      const time = new Date(record.paid_at).getTime();
      return paymentMode(record) === mode && time >= previousStart && time < currentStart;
    })
    .reduce((sum, record) => sum + record.amount, 0);

  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function MetricCard({
  title,
  amount,
  count,
  change,
  mode
}: {
  title: string;
  amount: number;
  count: number;
  change: number | null;
  mode: PaymentTab | "grand";
}) {
  const Icon = mode === "onsite" ? Banknote : mode === "online" ? CreditCard : Wallet;
  return (
    <Card className={cn("overflow-hidden", mode === "grand" ? "border-emerald-200 bg-emerald-50/50" : "bg-card")}>
      <CardContent className="flex min-h-28 items-start gap-2 p-3 sm:p-4">
        <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white", mode === "onsite" ? "bg-sky-600" : "bg-emerald-600")}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">{title}</p>
          <p className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{formatCurrency(amount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{count} transaction{count === 1 ? "" : "s"}</p>
        </div>
        {mode !== "grand" ? (
          <span className={cn("self-end whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold", (change ?? 0) >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>
            {(change ?? 0) >= 0 ? "↑" : "↓"} {Math.abs(change ?? 0)}%
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  itemsPerPage,
  totalCount,
  itemLabel,
  onChange
}: {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalCount: number;
  itemLabel: string;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border/70 px-3 py-2 text-xs">
      <p className="text-muted-foreground">
        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
        {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} {itemLabel}
        {totalCount === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onChange(page)}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${
              page === currentPage
                ? "bg-emerald-700 text-white"
                : "border border-border text-muted-foreground hover:bg-muted/40"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function AdminFinancialOverview({ records }: { records: FinancialRecord[] }) {
  const [activeTab, setActiveTab] = useState<PaymentTab>("online");
  const [search, setSearch] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);
  const rangeContainerRef = useRef<HTMLDivElement>(null);
  const rangeTriggerRef = useRef<HTMLButtonElement>(null);
  const pageSize = 7;
  const onlineRecords = records.filter((record) => paymentMode(record) === "online");
  const onsiteRecords = records.filter((record) => paymentMode(record) === "onsite");
  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records
      .filter((record) => paymentMode(record) === activeTab)
      .filter((record) => {
        const paidDate = record.paid_at.slice(0, 10);
        return (!dateStart || paidDate >= dateStart) && (!dateEnd || paidDate <= dateEnd);
      })
      .filter((record) => status === "all" || (status === "settled" ? record.settlement_status === "settled" : record.settlement_status !== "settled"))
      .filter((record) => !query || [record.tourist_name, record.receipt_reference ?? "", record.booking_id ?? ""].some((value) => value.toLowerCase().includes(query)))
      .sort((left, right) => new Date(right.paid_at).getTime() - new Date(left.paid_at).getTime());
  }, [activeTab, dateEnd, dateStart, records, search, status]);

  const totalPages = Math.max(1, Math.ceil(visibleRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRecords = visibleRecords.slice((safePage - 1) * pageSize, safePage * pageSize);

  const onlineTotal = onlineRecords.reduce((sum, record) => sum + record.amount, 0);
  const onsiteTotal = onsiteRecords.reduce((sum, record) => sum + record.amount, 0);
  const grandTotal = onlineTotal + onsiteTotal;
  const onlinePercent = grandTotal > 0 ? Math.round((onlineTotal / grandTotal) * 1000) / 10 : 0;
  const onsitePercent = grandTotal > 0 ? Math.round((onsiteTotal / grandTotal) * 1000) / 10 : 0;
  const recentOnsite = [...onsiteRecords].sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()).slice(0, 4);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, dateStart, dateEnd, status]);

  useEffect(() => {
    if (!rangeOpen) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      const clickedInsideTrigger = rangeTriggerRef.current && rangeTriggerRef.current.contains(target);
      const clickedInsideDropdown = target.closest('[data-financials-range-picker]') !== null;
      if (!clickedInsideTrigger && !clickedInsideDropdown) {
        setRangeOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setRangeOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [rangeOpen]);

  function applyRange(range: DateRange | undefined) {
    const from = range?.from ? formatDateKey(range.from) : "";
    const to = range?.to ? formatDateKey(range.to) : from;
    setDateStart(from);
    setDateEnd(to);
    setDraftRange(range);
    setRangeOpen(false);
  }

  const rangeLabel = !dateStart && !dateEnd ? "All time" : `${dateStart} — ${dateEnd}`;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 lg:grid-cols-3">
        <MetricCard title="Total Online Payments" amount={onlineTotal} count={onlineRecords.length} change={percentChange(records, "online")} mode="online" />
        <MetricCard title="Total Onsite Payments" amount={onsiteTotal} count={onsiteRecords.length} change={percentChange(records, "onsite")} mode="onsite" />
        <MetricCard title="Grand Total" amount={grandTotal} count={records.length} change={null} mode="grand" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr),minmax(20rem,0.75fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 pb-2">
            <div className="flex flex-wrap gap-2">
              {(["online", "onsite"] as PaymentTab[]).map((tab) => (
                <Button key={tab} type="button" size="sm" variant={activeTab === tab ? "default" : "outline"} onClick={() => setActiveTab(tab)}>
                  {tab === "online" ? <CreditCard className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                  {modeLabel(tab)} Payments
                </Button>
              ))}
            </div>
            <div className="grid gap-2 pt-1 md:grid-cols-[minmax(0,1fr),auto,auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, receipt, or booking..." className="h-9 w-full rounded-[0.8rem] border border-input bg-background pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <div ref={rangeContainerRef} className="relative" data-financials-range-picker>
                <button
                  ref={rangeTriggerRef}
                  type="button"
                  onClick={() => {
                    setDraftRange(dateStart ? { from: new Date(dateStart), to: dateEnd ? new Date(dateEnd) : new Date(dateStart) } : undefined);
                    setRangeOpen((current) => !current);
                  }}
                  className="flex h-9 w-full items-center gap-2 rounded-[0.8rem] border border-input bg-background px-3 text-xs md:w-auto"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{rangeLabel}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", rangeOpen ? "rotate-180" : "")} />
                </button>
                {rangeOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-[1rem] border border-border/70 bg-card shadow-[0_22px_50px_rgba(22,74,47,0.16)]">
                    <Calendar
                      mode="range"
                      numberOfMonths={1}
                      selected={draftRange}
                      onSelect={(range) => {
                        setDraftRange(range);
                        if (range?.from && range?.to) {
                          applyRange(range);
                        }
                      }}
                      className="bg-transparent p-2"
                    />
                    <div className="flex items-center justify-end gap-2 border-t border-border/60 px-2 py-2">
                      <Button type="button" variant="ghost" size="sm" className="min-h-8" onClick={() => applyRange(undefined)}>Clear</Button>
                    </div>
                  </div>
                ) : null}
               </div>
               <label className="relative block">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="h-9 w-full rounded-[0.8rem] border border-input bg-background pl-9 pr-3 text-xs" aria-label="Payment status">
                  <option value="all">All status</option>
                  <option value="settled">Settled</option>
                  <option value="unsettled">Unsettled</option>
                </select>
              </label>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto xl:overflow-x-visible">
              <table className="w-full min-w-[760px] xl:min-w-0 text-left text-xs">
                <thead className="border-b border-border/70 bg-muted/30 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  <tr><th className="px-3 py-2">Date &amp; time</th><th className="px-3 py-2">Guest name</th><th className="px-3 py-2">Booking no.</th><th className="px-3 py-2">Receipt no.</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {pageRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-muted/20">
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{new Date(record.paid_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</td>
                      <td className="px-3 py-2 font-medium">{record.tourist_name}</td>
                      <td className="px-3 py-2 font-mono text-[10px]">{record.booking_id?.slice(0, 12) ?? "-"}</td>
                      <td className="px-3 py-2 font-mono text-[10px]">{record.receipt_reference ?? "-"}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-semibold">{formatCurrency(record.amount)}</td>
                      <td className="px-3 py-2"><div className="flex flex-col items-start gap-1"><Badge variant={record.booking_status === "declined" || record.booking_status === "cancelled" ? "destructive" : "success"}>{record.booking_status ? formatBookingStatusLabel(record.booking_status) : "Completed"}</Badge><span className="text-[10px] text-muted-foreground">Payout: {record.settlement_status === "settled" ? "Recorded" : "Pending"}</span></div></td>
                      <td className="px-3 py-2"><Link href={`/admin/financials/${record.id}` as Route} aria-label={`View payment ${record.id}`}><Button type="button" size="sm" variant="outline" className="min-h-8 rounded-md px-2.5"><Eye className="h-3.5 w-3.5" /></Button></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 ? (
              <PaginationBar
                currentPage={safePage}
                totalPages={totalPages}
                itemsPerPage={pageSize}
                totalCount={visibleRecords.length}
                itemLabel="record"
                onChange={setPage}
              />
            ) : null}
            {visibleRecords.length === 0 ? <p className="p-5 text-xs text-muted-foreground">No payments match these filters.</p> : null}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(#087f45 ${onlinePercent}%, #7bd36f ${onlinePercent}% 100%)` }}>
                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card text-center"><strong>{formatCurrency(grandTotal)}</strong><span className="text-[10px] text-muted-foreground">Total</span></div>
              </div>
              <div className="grid gap-2 text-xs"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-700" />Online</span><strong>{formatCurrency(onlineTotal)} <span className="text-[10px] font-normal text-muted-foreground">({onlinePercent}%)</span></strong></div><div className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-lime-400" />Onsite</span><strong>{formatCurrency(onsiteTotal)} <span className="text-[10px] font-normal text-muted-foreground">({onsitePercent}%)</span></strong></div></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Onsite Activity</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recentOnsite.map((record) => <div key={record.id} className="flex items-center gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-800">{initials(record.tourist_name)}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{record.tourist_name}</p><p className="text-[10px] text-muted-foreground">{new Date(record.paid_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</p></div><div className="text-right"><p className="text-xs font-semibold">{formatCurrency(record.amount)}</p><Badge variant="success">Recorded</Badge></div></div>)}
              {recentOnsite.length === 0 ? <p className="text-xs text-muted-foreground">No onsite payments recorded yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
