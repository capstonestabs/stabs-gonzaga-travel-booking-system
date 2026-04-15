import Image from "next/image";

import FrenelynMaltizo from "@/Assets/DeveloperPictures/FrenelynMaltizo.jpg";
import KicyJoyTorresSegundo from "@/Assets/DeveloperPictures/KicyJoyTorresSegundo.jpg";
import KrizelBuscasPerucho from "@/Assets/DeveloperPictures/KrizelBuscasPerucho.jpg";
import SophiaJoyCummiting from "@/Assets/DeveloperPictures/SophiaJoyCummiting.jpg";
import { ScenicPageHero } from "@/components/site/scenic-page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const developers = [
  {
    name: "Frenelyn Maltizo",
    image: FrenelynMaltizo
  },
  {
    name: "Sophia Joy A. Cummiting",
    image: SophiaJoyCummiting
  },
  {
    name: "Krizel Buscas Perucho",
    image: KrizelBuscasPerucho
  },
  {
    name: "Segundo Torres Kicy Joy",
    image: KicyJoyTorresSegundo
  }
] as const;

export default function AboutPage() {
  return (
    <div className="pb-16">
      <ScenicPageHero
        badge="About us"
        title="Smart Tourism Assistance and Booking System"
        intro="STABS helps travelers discover Gonzaga destinations, compare service options, and keep bookings in one easier travel experience."
        asideTitle="Built for Gonzaga"
        asideText="From quiet escapes to seaside stops, STABS makes it easier to choose where to go next."
      />

      <section className="page-shell py-8 sm:py-10">
        <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-3">
                <Badge variant="muted">About us</Badge>
                <h1 className="page-title">A Gonzaga-focused travel platform for easier trip planning.</h1>
                <p className="page-intro">
                  STABS was designed to help visitors explore local destinations, compare service
                  packages, reserve online when available, and contact walk-in destinations with
                  less confusion example.
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
                <Badge variant="muted">How it helps</Badge>
                <p className="text-sm leading-7 text-muted-foreground">
                  Visitors can browse destinations, compare packages, and review contact details
                  before deciding whether to reserve online or inquire directly.
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  The platform keeps tourist, staff, and admin workflows connected so destination
                  updates, bookings, and payout records stay organized in one place.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-6">
                <Badge variant="muted">Developers</Badge>
                <div className="grid gap-3 min-[420px]:grid-cols-2">
                  {developers.map((developer) => (
                    <div
                      key={developer.name}
                      className="overflow-hidden rounded-[1rem] border border-border/70 bg-muted/35"
                    >
                      <div className="relative aspect-[4/4.4] overflow-hidden bg-muted/45">
                        <Image
                          src={developer.image}
                          alt={developer.name}
                          fill
                          sizes="(max-width: 419px) 100vw, (max-width: 767px) 50vw, 240px"
                          className="object-cover object-center"
                        />
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium leading-6 text-foreground/88">
                          {developer.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
