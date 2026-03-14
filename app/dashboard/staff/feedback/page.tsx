import { DeleteFeedbackButton } from "@/components/forms/delete-feedback-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell } from "@/components/site/dashboard-shell";
import { ProgressiveList } from "@/components/ui/progressive-list";
import { requireRole } from "@/lib/auth";
import { getDestinationForStaff, getFeedbackEntriesForStaff } from "@/lib/repositories";

export default async function StaffFeedbackPage() {
  const context = await requireRole(["staff"]);
  const [feedbackEntries, destination] = await Promise.all([
    getFeedbackEntriesForStaff(context.authUserId, 24),
    getDestinationForStaff(context.authUserId)
  ]);

  return (
    <DashboardShell
      role="staff"
      title="Feedback"
      description="Review the latest public feedback submitted for your assigned destination."
    >
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/70">
          <CardTitle>Feedback</CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest destination-specific messages received through the public feedback form.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {destination ? (
            <div className="rounded-[1rem] bg-muted/45 px-4 py-3 text-sm text-muted-foreground">
              Showing feedback for <span className="font-medium text-foreground">{destination.title}</span>.
            </div>
          ) : null}

          {feedbackEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No feedback entries are available for your destination yet.
            </p>
          ) : null}

          {feedbackEntries.length > 0 ? (
            <ProgressiveList
              initialCount={8}
              step={8}
              maxHeightClass="max-h-[72vh]"
              showMoreLabel="Show more feedback"
              showLessLabel="Show less feedback"
            >
              {feedbackEntries.map((feedback) => (
                <div
                  key={feedback.id}
                  className="space-y-3 rounded-2xl border border-border/70 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{feedback.name}</p>
                      <p className="text-sm text-muted-foreground">{feedback.email}</p>
                    </div>
                    <div className="grid gap-2 sm:justify-items-end">
                      <p className="text-sm text-muted-foreground">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </p>
                      <DeleteFeedbackButton
                        feedbackId={feedback.id}
                        authorName={feedback.name}
                      />
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-foreground">{feedback.message}</p>
                </div>
              ))}
            </ProgressiveList>
          ) : null}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
