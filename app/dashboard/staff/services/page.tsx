import { CalendarRange, PackageSearch } from "lucide-react";

import { DashboardShell } from "@/components/site/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth";
import { getDestinationForStaff } from "@/lib/repositories";
import { formatCurrency } from "@/lib/utils";
import { ServicesManagerShell } from "@/components/site/services-manager-shell";

export default async function StaffServicesPage() {
  const context = await requireRole(["staff"]);
  const destination = await getDestinationForStaff(context.authUserId);

  if (!destination) {
    return (
      <DashboardShell
        role="staff"
        title="Services & packages"
        description="Create, manage, and schedule the service packages that tourists can book for your destination."
      >
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            <p>No destination is linked to this staff account yet.</p>
            <p className="mt-2">
              Ask the admin to create a destination for you first.
            </p>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const services = destination.destination_services ?? [];

  return (
    <DashboardShell
      role="staff"
      title="Services & packages"
      description="Create bookable services, add optional service photos, define their date window, and manage monthly availability with a visual calendar."
    >
      <div className="flex flex-wrap gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/45 px-3 py-1.5 text-sm text-foreground/82">
          <PackageSearch className="h-4 w-4 text-primary" />
          Manage package details
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/45 px-3 py-1.5 text-sm text-foreground/82">
          <CalendarRange className="h-4 w-4 text-primary" />
          Control monthly availability
        </span>
      </div>
      <ServicesManagerShell
        destination={destination}
        initialServices={services}
      />
    </DashboardShell>
  );
}
