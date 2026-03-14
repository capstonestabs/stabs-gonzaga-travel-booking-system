export type UserRole = "user" | "staff" | "admin";
export type ListingCategory = "tour" | "stay";
export type BookingType = "online" | "walk-in";
export type ServiceType = "standard" | "package" | "discounted";
export type ListingStatus = "draft" | "published" | "archived";
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled";
export type FinancialSettlementStatus = "unsettled" | "settled";

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  avatar_path?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  user_id: string;
  display_name?: string | null;
  business_name?: string | null;
  bio?: string | null;
  base_location?: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithStaffProfile extends AppUser {
  staff_profile?: StaffProfile | null;
}

export interface DestinationImage {
  id: string;
  destination_id: string;
  storage_path: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface DestinationService {
  id: string;
  destination_id: string;
  title: string;
  description: string | null;
  price_amount: number;
  service_type: ServiceType;
  daily_capacity: number;
  image_path?: string | null;
  image_url?: string | null;
  availability_start_date?: string | null;
  availability_end_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DestinationAvailabilityWindow {
  id: string;
  destination_id: string;
  start_date: string;
  end_date: string;
  default_capacity: number;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface DestinationAvailabilityOverride {
  id: string;
  destination_id: string;
  service_date: string;
  capacity: number;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  slug: string;
  staff_id: string;
  category: ListingCategory;
  booking_type: BookingType;
  status: ListingStatus;
  title: string;
  summary: string;
  description: string;
  location_text: string;
  province: string | null;
  city: string | null;
  currency: "PHP";
  inclusions: string[];
  policies: string[];
  cover_path: string | null;
  cover_url: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
  staff_profile?: StaffProfile | null;
  destination_images?: DestinationImage[];
  destination_services?: DestinationService[];
}

export interface FinancialRecordSummary {
  id: string;
  booking_id?: string | null;
  settlement_status: FinancialSettlementStatus;
  receipt_reference?: string | null;
  deleted_booking_at?: string | null;
}

export interface Booking {
  id: string;
  user_id: string;
  destination_id: string;
  staff_id: string;
  status: BookingStatus;
  ticket_code: string | null;
  service_date: string;
  guest_count: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  notes: string | null;
  total_amount: number;
  currency: "PHP";
  service_id: string | null;
  service_snapshot: {
    id: string;
    title: string;
    description: string | null;
    price_amount: number;
    service_type: ServiceType;
  } | null;
  destination_snapshot: {
    title: string;
    category: ListingCategory;
    location_text: string;
    summary: string;
  };
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  destination?: Destination | null;
  payment?: Payment | null;
  financial_record?: FinancialRecordSummary | null;
}

export interface Payment {
  id: string;
  booking_id: string;
  paymongo_checkout_session_id: string | null;
  paymongo_payment_id: string | null;
  paymongo_event_id: string | null;
  checkout_url: string | null;
  status: PaymentStatus;
  amount: number;
  currency: "PHP";
  payment_method_type: string | null;
  raw_payload: Record<string, unknown> | null;
  livemode: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackEntry {
  id: string;
  destination_id: string | null;
  name: string;
  email: string;
  message: string;
  created_at: string;
  destination?: Pick<Destination, "id" | "slug" | "title" | "location_text"> | null;
}

export interface AvailabilitySnapshot {
  is_open: boolean;
  capacity: number;
  confirmed_guests: number;
  locked_guests: number;
  remaining_guests: number;
}

export type AvailabilityDayStatus = "available" | "closed" | "full";

export interface AvailabilityCalendarDay {
  date: string;
  status: AvailabilityDayStatus;
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
}

export interface StaffDashboardData {
  metrics: DashboardMetric[];
  listings: Destination[];
  recentBookings: Booking[];
  feedbackEntries: FeedbackEntry[];
}

export interface FinancialRecord {
  id: string;
  booking_id: string | null;
  payment_id: string | null;
  destination_id: string;
  staff_id: string;
  user_id: string;
  destination_title: string;
  destination_location_text: string;
  destination_category: ListingCategory;
  staff_name: string | null;
  tourist_name: string;
  tourist_email: string | null;
  service_date: string;
  guest_count: number;
  amount: number;
  currency: "PHP";
  payment_method_type: string | null;
  ticket_code: string | null;
  paid_at: string;
  settlement_status: FinancialSettlementStatus;
  settled_at: string | null;
  receipt_reference: string | null;
  settlement_notes: string | null;
  deleted_booking_at: string | null;
  archived_at?: string | null;
  purged_at?: string | null;
  service_snapshot?: {
    id: string;
    title: string;
    description: string | null;
    price_amount: number;
    service_type: ServiceType;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface AdminFinancialDestinationOption {
  id: string;
  title: string;
  location_text: string;
  category: ListingCategory;
  staff_id: string;
}

export interface AdminFinancialTouristOption {
  id: string;
  full_name: string | null;
  email: string;
}

export interface DestinationRevenueSummary {
  destination_id: string;
  destination_title: string;
  destination_location_text: string;
  staff_name: string | null;
  booking_count: number;
  total_paid_amount: number;
  settled_amount: number;
  unsettled_amount: number;
}

export interface AdminDashboardData {
  metrics: DashboardMetric[];
  financialMetrics: DashboardMetric[];
  bookingMetrics: DashboardMetric[];
  listings: Destination[];
  staff: UserWithStaffProfile[];
  destinationRevenue: DestinationRevenueSummary[];
  financialRecords: FinancialRecord[];
  archivedFinancialRecordCount: number;
}

export interface ProfileBundle {
  user: AppUser;
  staffProfile: StaffProfile | null;
}
