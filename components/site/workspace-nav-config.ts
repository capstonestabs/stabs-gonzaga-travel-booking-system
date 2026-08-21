export type DashboardNavIconName =
  | "overview"
  | "home"
  | "destination"
  | "pin"
  | "services"
  | "bookings"
  | "feedback"
  | "account"
  | "staff"
  | "tourists"
  | "create"
  | "financials"
  | "history"
  | "tickets"
  | "reports"
  | "settings"
  | "activity";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: DashboardNavIconName;
  matchHrefs?: string[];
};

export type AdminNavSection = {
  title: string;
  items: WorkspaceNavItem[];
};

export const adminNavSections: AdminNavSection[] = [
  {
    title: "Main menu",
    items: [
      { href: "/admin", label: "Overview", icon: "home" },
      { href: "/admin/tourists", label: "Tourists", icon: "tourists" },
      { href: "/admin/destination-financials", label: "Destinations", icon: "pin" },    
      // { href: "/admin/financials", label: "Financials", icon: "financials" }, 
    // { href: "/admin/financials/history", label: "Payout history", icon: "history" },
      { href: "/admin/staff", label: "Staff", icon: "staff", matchHrefs: ["/admin/staff/create"] },
      { href: "/admin/reports", label: "Reports & Analytics", icon: "reports" }
    ]
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: "settings" },
      { href: "/admin/activity-logs", label: "Activity Logs", icon: "activity" }
    ]
  }
];

export const workspaceNavByRole = {
  user: [
    { href: "/account", label: "Overview", icon: "overview" },
    { href: "/account/current", label: "Current bookings", icon: "bookings" },
    { href: "/account/tickets", label: "Ticket wallet", icon: "tickets" },
    { href: "/account/history", label: "Booking history", icon: "history" },
    { href: "/profile", label: "Account settings", icon: "account", matchHrefs: ["/account/profile"] }
  ],
  staff: [
    { href: "/staff", label: "Dashboard", icon: "overview" },
    { href: "/staff/services", label: "Services", icon: "services" },

    { href: "/staff/bookings", label: "Bookings", icon: "bookings" },
    { href: "/staff/financials", label: "Financials", icon: "financials" },
    { href: "/staff/account", label: "Profile", icon: "account" }
  ],
  admin: adminNavSections.flatMap((section) => section.items)
} satisfies Record<"user" | "staff" | "admin", WorkspaceNavItem[]>;