import { ScenicPageHero } from "@/components/site/scenic-page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="pb-16">
      <ScenicPageHero
        badge="About"
        title="A simpler way to explore and plan Gonzaga trips."
        intro="STABS helps visitors compare destinations, browse service options, and keep their travel plans in one easy place."
        asideTitle="Built for Gonzaga"
        asideText="From quiet escapes to seaside stops, STABS makes it easier to choose where to go next."
      />

      <section className="page-shell py-8 sm:py-10">
        <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-3">
                <Badge variant="muted">What STABS offers</Badge>
                <h1 className="page-title">Browse, compare, and book Gonzaga destinations with more ease.</h1>
                <p className="page-intro">
                  Browse destination stories, compare services, check available days, and decide
                  whether to reserve online or contact the destination directly.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.1rem] border border-border/70 bg-muted/35 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    For travelers
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Browse destinations, compare services and rates, reserve online, and keep your
                    upcoming trips and passes in one place.
                  </p>
                </div>
                <div className="rounded-[1.1rem] border border-border/70 bg-muted/35 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    For staff
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Keep one destination up to date, shape the service lineup, and stay on top of
                    the bookings tied to that place.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card>
              <CardContent className="space-y-3 p-6">
                <Badge variant="muted">Booking policy</Badge>
                <p className="text-sm leading-7 text-muted-foreground">
                  Guests can browse destinations, services, pricing, and contact details without an
                  account. You only need an account when you are ready to reserve online.
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  Confirmed bookings are final, while walk-in destinations stay contact-first so
                  they do not affect online slot availability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-6">
                <Badge variant="muted">Reservation flow</Badge>
                <p className="text-sm leading-7 text-muted-foreground">
                  Choose a destination, pick the service that fits your trip, and continue only
                  when the schedule feels right. After that, everything you need stays in your
                  account for easy reference.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
