import { ListingCard } from "@/components/site/listing-card";
import { ScenicPageHero } from "@/components/site/scenic-page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedDestinations } from "@/lib/repositories";

function sortByDisplaySeed(a: { slug: string }, b: { slug: string }) {
  const score = (value: string) =>
    value.split("").reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0);

  return score(a.slug) - score(b.slug);
}

export default async function DestinationsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  let destinations = [] as Awaited<ReturnType<typeof getPublishedDestinations>>;
  let destinationsAvailable = true;

  try {
    destinations = await getPublishedDestinations();
  } catch {
    destinationsAvailable = false;
  }

  const query = q.trim().toLowerCase();
  const filteredDestinations = query
    ? destinations.filter((destination) =>
        [destination.title, destination.summary, destination.location_text, destination.category]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    : destinations;
  const curatedDestinations = [...destinations].sort(sortByDisplaySeed).slice(0, 6);
  const visibleDestinations = query
    ? filteredDestinations.length > 0
      ? filteredDestinations
      : curatedDestinations
    : destinations;
  const showingFallbackResults = Boolean(query) && filteredDestinations.length === 0 && curatedDestinations.length > 0;

  return (
    <div className="pb-14">
      <ScenicPageHero
        badge="Destinations"
        title="Find the Gonzaga stop that fits your next getaway."
        intro="Browse scenic stays, quiet escapes, and day-trip spots with real photos, service options, and trip details."
        meta={query ? `Showing results for "${q}"` : null}
        asideTitle="Made for choosing"
        asideText="Compare places, open the full destination pages, and narrow it down to the one that feels right for your trip."
      />

      <section className="page-shell py-4 sm:py-6">
        <div className="space-y-4">
          {!query ? (
            <div className="mb-2 flex justify-center">
              <Badge variant="muted">Popular destinations</Badge>
            </div>
          ) : null}

          {!destinationsAvailable ? (
            <Card>
              <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                <p>Destinations are taking a moment to load.</p>
                <p>Please try again shortly to keep exploring Gonzaga trip ideas.</p>
              </CardContent>
            </Card>
          ) : destinations.length === 0 ? (
            <Card>
              <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                <p>New destinations are on the way.</p>
                <p>As soon as fresh listings are ready, they will appear here with photos and rates.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {showingFallbackResults ? (
                <Card>
                  <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
                    <p>No exact match was found for "{q}".</p>
                    <p>Here are a few other Gonzaga destinations you might still like.</p>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleDestinations.map((destination) => (
                  <ListingCard key={destination.id} destination={destination} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
