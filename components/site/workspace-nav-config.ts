export type DashboardNavIconName =
  | "overview"
  | "destination"
  | "services"
  | "bookings"
  | "feedback"
  | "account"
  | "staff"
  | "tourists"
  | "create"
  | "financials"
  | "history"
  | "tickets";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: DashboardNavIconName;
  matchHrefs?: string[];
};

export const workspaceNavByRole = {
  user: [
    { href: "/account", label: "Overview", icon: "overview" },
    { href: "/account/current", label: "Current bookings", icon: "bookings" },
    { href: "/account/tickets", label: "Ticket wallet", icon: "tickets" },
    { href: "/account/history", label: "Booking history", icon: "history" },
    { href: "/profile", label: "Account settings", icon: "account", matchHrefs: ["/account/profile"] }
  ],
  staff: [
    { href: "/staff", label: "Overview", icon: "overview" },
    { href: "/staff/destination", label: "Destination", icon: "destination" },
    { href: "/staff/services", label: "Services", icon: "services" },
    { href: "/staff/bookings", label: "Bookings", icon: "bookings" },
    { href: "/staff/feedback", label: "Feedback", icon: "feedback" },
    { href: "/staff/account", label: "Account", icon: "account" }
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: "overview" },
    { href: "/admin/financials", label: "Financials", icon: "financials" },
    { href: "/admin/financials/history", label: "Payout history", icon: "history" },
    { href: "/admin/staff", label: "Staff", icon: "staff" },
    { href: "/admin/tourists", label: "Tourists", icon: "tourists" },
    { href: "/admin/staff/create", label: "Create staff", icon: "create" }
  ]
} satisfies Record<"user" | "staff" | "admin", WorkspaceNavItem[]>;
