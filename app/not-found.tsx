import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="gradient-chip">404</div>
      <h1 className="font-display text-5xl font-semibold tracking-tight">Page not found</h1>
      <p className="section-copy text-center">
        The page or destination you requested could not be found in Gonzaga Travel Bookings.
      </p>
      <Link href="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
