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
        title=" "
        description=" "
      >
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            {/* <p>No destination is linked to this staff account yet.</p>
            <p className="mt-2">
              Ask the admin to create a destination for you first.
            </p> */}
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const services = destination.destination_services ?? [];

  return (
    <DashboardShell
      role="staff"
      title=" "
      description=" "
    >
      <ServicesManagerShell
        destination={destination}
        initialServices={services}
      />
    </DashboardShell>
  );
}
