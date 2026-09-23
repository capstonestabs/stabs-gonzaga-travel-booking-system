"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TouristTicketWalletBrowser } from "@/components/site/tourist-ticket-wallet-browser";
import { DashboardShell } from "@/components/site/dashboard-shell";
import Link from "next/link";

const TICKETS_PER_PAGE = 12;

interface TouristTicketsClientProps {
  initialBookings: any[];
  initialPage: number;
}

export function TouristTicketsClient({ initialBookings, initialPage }: TouristTicketsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings] = useState(initialBookings);
  const [currentPage, setCurrentPage] = useState(initialPage);

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1", 10);
    setCurrentPage(Math.max(1, page));
  }, [searchParams]);

  const totalPages = Math.ceil(bookings.length / TICKETS_PER_PAGE);
  const validPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (validPage - 1) * TICKETS_PER_PAGE;
  const paginatedBookings = bookings.slice(startIndex, startIndex + TICKETS_PER_PAGE);

  const handlePageChange = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    router.push((url.pathname + url.search) as Route);
  };

  return (
    <DashboardShell
      role="user"
      title="Ticket wallet"
      description="Open any confirmed or completed pass here, then save the ticket image when you need it."
    >
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="space-y-3.5 p-6 text-sm text-muted-foreground">
            <p>No booking passes are ready yet.</p>
            <p>Once a reservation is confirmed, its ticket will appear here for quick access.</p>
            <Link href="/destinations">
              <Button variant="secondary">
                <Ticket className="h-4 w-4" />
                Browse destinations
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <TouristTicketWalletBrowser bookings={paginatedBookings} />
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={validPage === 1}
                onClick={() => handlePageChange(validPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="px-4 text-sm text-muted-foreground">
                Page {validPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={validPage === totalPages}
                onClick={() => handlePageChange(validPage + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )
    }
    </DashboardShell>
  );
}