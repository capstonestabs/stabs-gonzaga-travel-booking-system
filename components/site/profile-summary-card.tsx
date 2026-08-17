import { AtSign, Mail, Phone, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AppUser, StaffProfile, UserRole } from "@/lib/types";
import { getInitials } from "@/lib/utils";

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-16 w-16 rounded-[1.25rem] border border-border object-cover sm:h-[4.5rem] sm:w-[4.5rem]"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-primary text-xl font-semibold text-primary-foreground sm:h-[4.5rem] sm:w-[4.5rem]">
      {getInitials(name)}
    </div>
  );
}

export function ProfileSummaryCard({
  role,
  user,
  email,
  staffProfile,
  heading
}: {
  role: UserRole;
  user: AppUser;
  email?: string;
  staffProfile?: StaffProfile | null;
  heading?: string;
}) {
  const loginEmail = email ?? user.email;
  const title = user.full_name || loginEmail || "Profile";
  const showStaffContacts = role === "staff" || Boolean(staffProfile);
  const accountPhone = user.phone?.trim() || null;
  const contactEmail = staffProfile?.contact_email?.trim() || null;
  const contactPhone = staffProfile?.contact_phone?.trim() || null;
  const showAccountPhone =
    !showStaffContacts || Boolean(accountPhone && accountPhone !== contactPhone);

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={title} avatarUrl={user.avatar_url} />
          <div className="space-y-2">
            {heading ? <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{heading}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-[1.55rem] font-semibold tracking-tight sm:text-[1.7rem]">{title}</h2>
              <Badge>{role}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{loginEmail}</p>
          </div>
        </div>

        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              Full name
            </dt>
            <dd className="font-medium">{user.full_name ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {showStaffContacts ? "Login email" : "Email"}
            </dt>
            <dd className="font-medium">{loginEmail}</dd>
          </div>
          {showAccountPhone ? (
            <div>
              <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {showStaffContacts ? "Account phone" : "Phone"}
              </dt>
              <dd className="font-medium">{accountPhone ?? "Not set"}</dd>
            </div>
          ) : null}
          {showStaffContacts ? (
            <>
              <div>
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <AtSign className="h-3.5 w-3.5" />
                  Destination contact email
                </dt>
                <dd className="font-medium">{contactEmail ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  Destination contact phone
                </dt>
                <dd className="font-medium">{contactPhone ?? "Not set"}</dd>
              </div>
            </>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
