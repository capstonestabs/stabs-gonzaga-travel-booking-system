import { FeedbackForm } from "@/components/forms/feedback-form";
import { ScenicPageHero } from "@/components/site/scenic-page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedDestinations } from "@/lib/repositories";

export default async function FeedbackPage({
  searchParams
}: {
  searchParams: Promise<{ destinationId?: string }>;
}) {
  const { destinationId } = await searchParams;
  let destinations = [] as Awaited<ReturnType<typeof getPublishedDestinations>>;
  let destinationsAvailable = true;

  try {
    destinations = await getPublishedDestinations();
  } catch {
    destinationsAvailable = false;
  }

  return (
    <div className="pb-16">
      <ScenicPageHero
        badge="Feedback"
        title="Ask a question or share a helpful travel note."
        intro="Send a suggestion, clear up a detail, or share feedback that could help future visitors plan their Gonzaga trip with confidence."
        asideTitle="Helpful notes"
        asideText="Questions, travel tips, and honest feedback all help shape better destination experiences."
      />

      <section className="page-shell py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr,0.95fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="gradient-chip w-fit">Feedback page</div>
              <h1 className="page-title">
                Share a note about a destination, service, or recent trip.
              </h1>
              <p className="page-intro">
                Choose the place you want to talk about and send your message straight to the team
                handling that destination.
              </p>
            </div>

            <Card>
              <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
                <Badge variant="muted">What feedback helps with</Badge>
                <p>Missing destination details or trip information</p>
                <p>Booking concerns or travel questions</p>
                <p>Suggestions that could make the next visit even better</p>
                {!destinationsAvailable ? (
                  <p className="text-destructive">
                    Destination choices are temporarily limited while the list reloads.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <FeedbackForm
            destinations={destinations.map((destination) => ({
              id: destination.id,
              title: destination.title,
              locationText: destination.location_text
            }))}
            defaultDestinationId={destinationId}
          />
        </div>
      </section>
    </div>
  );
}
