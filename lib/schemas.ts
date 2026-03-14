import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const signUpSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resendConfirmationSchema = z.object({
  email: z.string().email()
});

export const setPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const bookingSchema = z.object({
  destinationId: z.string().uuid(),
  serviceDate: z.string().min(1),
  guestCount: z.coerce.number().int().min(1).max(200),
  serviceId: z.string().uuid(),
  contactName: z.string().min(2).max(120),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(7).max(20),
  notes: z.string().max(1000).optional().or(z.literal(""))
});

export const checkoutDraftSchema = z.object({
  destinationId: z.string().uuid(),
  destinationSlug: z.string().min(1),
  destinationTitle: z.string().min(1),
  locationText: z.string().min(1),
  category: z.enum(["tour", "stay"]),
  priceAmount: z.number().min(0),
  serviceDate: z.string().min(1),
  guestCount: z.number().int().min(1),
  serviceId: z.string().uuid(),
  serviceSnapshot: z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable().optional(),
    price_amount: z.number(),
    service_type: z.enum(["standard", "package", "discounted"])
  }),
  contactName: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(5),
  notes: z.string()
});

export const destinationServiceSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2, "Service title must be at least 2 characters").max(70),
  description: z.string().max(280, "Description must be less than 280 characters").nullable().optional(),
  priceAmount: z.number().min(0, "Price cannot be negative"),
  serviceType: z.enum(["standard", "package", "discounted"]),
  imagePath: z.string().max(500).nullable().optional(),
  imageUrl: z.string().max(1000).nullable().optional(),
  availabilityStartDate: z.string().optional().nullable(),
  availabilityEndDate: z.string().optional().nullable(),
  isActive: z.boolean().default(true)
});

export const destinationSchema = z.object({
  title: z.string().min(4).max(140),
  summary: z.string().min(10).max(240),
  description: z.string().min(20).max(4000),
  locationText: z.string().min(3).max(160),
  province: z.string().max(80).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  category: z.enum(["tour", "stay"]),
  bookingType: z.enum(["online", "walk-in"]).default("online"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  inclusions: z.string().max(2000).optional().or(z.literal("")),
  policies: z.string().max(2000).optional().or(z.literal("")),
  featured: z.coerce.boolean().optional().default(false)
});

export const destinationStatusSchema = z.object({
  status: z.enum(["draft", "published", "archived"])
});

export const adminStaffSchema = z.object({
  destination: z.string().min(2).max(140),
  locationText: z.string().min(3).max(160),
  email: z.string().email(),
  defaultPassword: z.string().min(8).max(120)
});

export const adminResetStaffPasswordSchema = z.object({
  password: z.string().min(8).max(120)
});

export const staffDestinationAssignmentSchema = z.object({
  locationText: z.string().min(3).max(160)
});

export const selfProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().max(20).optional().or(z.literal("")),
  avatarUrl: z.string().max(500).optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional().or(z.literal(""))
});

export const managedStaffProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().max(20).optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().max(20).optional().or(z.literal(""))
});

export const uploadSchema = z.object({
  destinationId: z.string().uuid().optional(),
  folder: z.enum(["avatars", "covers", "destinations", "tours", "services"]),
  altText: z.string().max(180).optional(),
  sortOrder: z.coerce.number().int().min(0).max(4).optional()
});

export const feedbackSchema = z.object({
  destinationId: z.string().uuid(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(2000)
});

export const availabilityWindowSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  defaultCapacity: z.coerce.number().int().min(1).max(500),
  isOpen: z.coerce.boolean().default(true)
});

export const availabilityOverrideSchema = z.object({
  serviceDate: z.string().min(1),
  capacity: z.coerce.number().int().min(0).max(500),
  isOpen: z.coerce.boolean().default(true)
});

export const destinationAvailabilitySchema = z.object({
  windows: z.array(availabilityWindowSchema).max(100),
  overrides: z.array(availabilityOverrideSchema).max(365)
});

export const financialSettlementSchema = z.object({
  receiptReference: z
    .string()
    .trim()
    .min(1, "Enter the payout receipt or reference.")
    .max(120, "Payout references must stay under 120 characters."),
  settlementNotes: z.string().trim().max(1000).optional().or(z.literal(""))
});

export const batchFinancialSettlementSchema = z.object({
  recordIds: z
    .array(z.string().uuid("Invalid financial record id."))
    .min(1, "Select at least one payout record."),
  receiptReference: z
    .string()
    .trim()
    .min(1, "Enter the payout receipt or reference.")
    .max(120, "Payout references must stay under 120 characters."),
  settlementNotes: z.string().trim().max(1000).optional().or(z.literal(""))
});

export const batchFinancialHistoryDeleteSchema = z.object({
  recordIds: z
    .array(z.string().uuid("Invalid financial record id."))
    .min(1, "Select at least one history record.")
});

export const batchStaffBookingActionSchema = z.object({
  bookingIds: z
    .array(z.string().uuid("Invalid booking id."))
    .min(1, "Select at least one booking.")
});
