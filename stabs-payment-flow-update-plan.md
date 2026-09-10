# STABS — Online/Onsite Payment Flow Update: Implementation Plan

## Context for next update

This is a capstone project: STABS (Smart Tourist Assistance and Booking System) for Gonzaga Travel Bookings. Next.js 15 App Router, TypeScript, Supabase, PayMongo (GCash-only hosted checkout), Brevo for email. This plan describes a booking/payment workflow overhaul. Read the referenced files first, confirm your understanding of current `booking_status` values and the checkout flow, then implement in the stages below — do not skip straight to writing code across all files at once. Match the existing UI: flat, mature design, pastel icon chips, compact spacing, thin dividers, simple text links. No gradients, no oversized cards, nothing that reads as "AI-generated." Reuse existing components (`components/ui/modal.tsx`, `button.tsx`, `badge.tsx`, `card.tsx`) rather than building new primitives.

---

## 1. Feature Overview

Currently, a tourist books and is (presumably) sent straight into the PayMongo GCash checkout flow. This update inserts a **staff confirmation gate** before payment, and introduces a **second payment mode (Onsite/Cash)** alongside the existing Online/GCash mode. The tourist picks their intended mode *at booking time*, but cannot actually pay (online) or receive their onsite receipt until staff has reviewed and confirmed the booking.

### Full flow

1. **Booking creation** — Tourist fills out the booking form on `app/listings/[slug]/book/page.tsx` and clicks **"Continue to checkout."**
2. **Payment mode modal** — A modal appears with two options: **Online Payment** and **Onsite Payment**. This only records the tourist's *intent* — no payment happens yet.
3. **Booking submitted, on hold** — The booking is created with:
   - `payment_mode`: `'online' | 'onsite'`
   - `booking_status`: a new **on-hold / awaiting confirmation** status (booking exists, no payment path is open yet)
   - A confirmation modal explains this to the tourist (copy below).
4. **Staff review** — Staff sees the booking (existing staff bookings manager) with **Confirm** and **Decline** actions.
   - **Confirm** → email sent to tourist → `booking_status` moves to a "confirmed, awaiting payment" state (exact next status depends on `payment_mode`).
   - **Decline** → email sent to tourist → `booking_status` → `cancelled` (or a distinct `declined` value if you want it separately reportable from tourist-cancelled bookings).
5. **Tourist checks status** — Via email, and via `app/account/current/page.tsx`:
   - **Online + confirmed** → a **"Proceed to Payment"** button appears → existing checkout flow → PayMongo hosted checkout (GCash) → webhook confirms → `completed` → existing receipt/ticket flow.
   - **Onsite + confirmed** → tourist is routed to a **new, simple receipt page** (separate from the existing QR ticket system) → `booking_status` → `awaiting_onsite_payment`.
6. **Onsite settlement** — Tourist shows their receipt at the destination. Staff verifies it against the booking, then **manually records the cash payment** in a staff UI. This creates a financial record entry tagged `payment_mode: onsite`, alongside existing online entries in the same totals/report views. `booking_status` → `completed`.

### Explicitly deferred (do NOT implement yet)

- Staff GCash account field in Account Settings. Skip this entirely for now — it's a separate future task and PayMongo cannot route funds to arbitrary staff-entered GCash numbers without a configured Platform/Payment-Splitting merchant relationship, which is out of scope.

---

## 2. Data Model Changes

**Read `supabase/SCHEMA.md` and the latest migration touching `booking_status` before making changes — confirm current enum values first.**

### 2.1 `booking_status` enum

Current known values: `pending_payment`, `confirmed`, `completed`, `cancelled`.

Proposed additions (adjust naming to match existing conventions if these differ):

- `awaiting_confirmation` — booking just submitted, staff hasn't acted yet (replaces the old immediate `pending_payment` entry point)
- `declined` — staff explicitly declined (or reuse `cancelled` with a separate `decline_reason` / `cancelled_by` column if you'd rather not grow the enum — recommend a **new value** so it's distinguishable in staff/admin reporting from tourist-initiated cancellations)
- `confirmed` — reuse existing; now means "staff approved, payment mode determines next step"
- `awaiting_onsite_payment` — confirmed, onsite mode, receipt issued, cash not yet collected
- `pending_payment` — reuse existing for the online path once staff has confirmed and the tourist is mid-PayMongo-checkout
- `completed` — reuse existing (both online-paid and onsite-settled bookings land here)

New status flow per mode:

```
Online:  awaiting_confirmation → confirmed → pending_payment → completed
                                             ↳ declined
Onsite:  awaiting_confirmation → confirmed → awaiting_onsite_payment → completed
                                             ↳ declined
```

### 2.2 New `payment_mode` column

Add to the `bookings` table: `payment_mode` enum/text: `'online' | 'onsite'`, set at creation, immutable after.

### 2.3 Onsite receipt fields

Either a new lightweight table `onsite_receipts` (recommended, keeps booking table clean) or columns directly on `bookings`:

- `receipt_code` (short unique code, generated when moving to `awaiting_onsite_payment`)
- `receipt_issued_at`
- `recorded_by_staff_id` (nullable until settled)
- `recorded_at` (nullable until settled)
- `amount_recorded`
- `payment_method` — fixed to `'cash'` for now, but keep it a field rather than hardcoded, since this is the natural place to extend later.

### 2.4 Financial records tagging

Confirm in `lib/financial-records.ts` whether records already carry a payment/source distinction. Add or extend a `payment_mode` (or `source`) column/field so admin/staff financial views can filter and total Online vs Onsite separately while still summing to one grand total. Reuse the existing `DestinationFinancialPanel` component's totals logic — don't fork it.

### 2.5 Migration

Write a new file under `supabase/migrations/` following the existing naming convention (`YYYYMMDDNNNN_description.sql`), additive only (new enum values, new nullable columns) — no destructive changes to existing rows.

---

## 3. File-by-File Changes

### `lib/types.ts`
Add `PaymentMode` type, extend `BookingStatus` type with new values.

### `lib/schemas.ts`
- Extend the booking creation Zod schema to require `payment_mode`.
- Add a schema for staff confirm/decline action payload (booking id + action + optional decline reason).
- Add a schema for the staff "record onsite payment" form (booking id, amount, receipt code, notes).

### `lib/booking-state.ts`
Add/extend transition functions so status changes are validated centrally (e.g. `canConfirm()`, `canDecline()`, `canRecordOnsitePayment()`), rather than scattering status-string checks across components. Follow existing patterns in this file.

### `app/listings/[slug]/book/page.tsx`
On "Continue to checkout" click, open the payment-mode modal (see copy below) instead of navigating directly. Selection sets `payment_mode` on the booking payload before submission.

### `components/forms/booking-form.tsx`
Wire the modal trigger and pass `payment_mode` through to the submit handler / API call.

### `app/api/bookings/route.ts`
- Accept `payment_mode` in the POST body (validate via updated schema).
- Set initial status to `awaiting_confirmation` (not the current default).
- Existing duplicate-booking check stays as-is.

### `app/api/bookings/[id]/confirm/route.ts`
Extend (or split into confirm/decline) to:
- On confirm: branch status by `payment_mode` → `confirmed` (both), then immediately compute the next-visible state the tourist will see (online → payment unlocked; onsite → generate `receipt_code` and move to `awaiting_onsite_payment`). Send confirmation email.
- On decline: status → `declined`, send decline email. Consider a new route `app/api/bookings/[id]/decline/route.ts` if you'd rather keep confirm/decline separate and explicit — recommended for clarity in the staff UI.

### `components/site/staff-bookings-manager.tsx`
Add Confirm/Decline actions for bookings in `awaiting_confirmation` status. Reuse the existing `InlineDropdown` / action-button patterns already in this component rather than introducing a new UI pattern. Add a new staff action + small form for **recording onsite cash payment** on bookings in `awaiting_onsite_payment` (amount, receipt code match, confirm button) — this can be a modal or inline expansion, matching how other in-place actions in this component currently work.

### `app/account/current/page.tsx`
Conditional rendering by `booking_status` + `payment_mode`:
- `awaiting_confirmation` → status message, no action button.
- `declined` → status message with reason if provided.
- `confirmed` + `online` → "Proceed to Payment" button → existing checkout flow.
- `awaiting_onsite_payment` → render the new onsite receipt view inline (or a link to the new receipt page — see below).
- `completed` → existing behavior.

### New: onsite receipt view
A new, simple, standalone component/page (separate from `lib/tickets.ts` / `lib/guest-tickets.ts` — do not touch the existing QR ticket system). Suggested location: `components/site/onsite-receipt-card.tsx`, rendered either inline on `account/current` or at a dedicated route like `app/account/bookings/[id]/onsite-receipt/page.tsx` (mirror the existing `app/account/bookings/[id]/ticket/page.tsx` pattern for consistency). Should display: receipt code, booking/service summary, guest count, total amount due, destination, and a clear "Pay onsite in cash — show this at check-in" instruction.

### `lib/financial-records.ts`
Add a function to insert a financial record when staff records an onsite payment, tagged with `payment_mode: 'onsite'`, so it flows into the same totals used by `DestinationFinancialPanel`.

### Email (`lib/booking-receipt-email.ts` or new files via Brevo)
Two new email templates needed: **booking confirmed** and **booking declined**. Check how `booking-receipt-email.ts` is structured and follow the same pattern/branding for consistency.

---

## 4. Modal & Messaging Copy

Keep tone friendly, clear, and reassuring — tourists should never feel like something went wrong when a booking goes "on hold."

### 4.1 Payment mode selection modal (on `book/page.tsx`, triggered by "Continue to checkout")

**Title:** How would you like to pay?

**Body intro:** Choose how you'd like to settle payment for this booking. You can review the details again before it's final.

**Option 1 — Online Payment**
- Label: "Pay Online (GCash)"
- Description: "Pay securely through GCash once your booking is confirmed by our staff. You'll get an instant digital receipt."

**Option 2 — Onsite Payment**
- Label: "Pay Onsite (Cash)"
- Description: "Reserve now, pay in cash when you arrive. You'll receive a receipt to present at check-in once your booking is confirmed."

Footer note (small text): "Your booking will first be reviewed by our staff before payment can proceed."

### 4.2 On-hold confirmation modal (after successful submission)

**Title:** Booking Submitted

**Body:** Your booking is now on hold while our staff reviews it. You'll receive an email once it's confirmed — this usually takes [X]. You can check your booking status anytime under **My Bookings**.

**Button:** Got it

### 4.3 Confirmation email — booking confirmed

**Subject:** Your booking has been confirmed — [Destination Name]

**Body:**
> Good news — your booking for **[Destination/Service Name]** on **[Date]** has been confirmed by our team.
>
> [If online]: You can now complete your payment. [Proceed to Payment button/link]
>
> [If onsite]: Your receipt is ready. Please present it at check-in when you arrive, and pay in cash on the day. [View Receipt button/link]
>
> Booking reference: [Booking ID / Code]

### 4.4 Decline email

**Subject:** Update on your booking request — [Destination Name]

**Body:**
> We're sorry — your booking request for **[Destination/Service Name]** on **[Date]** could not be confirmed at this time.
>
> [Reason, if provided by staff]
>
> Feel free to browse other available dates or destinations, or reach out if you have questions.

### 4.5 Onsite receipt view (page content)

**Header:** Your Onsite Payment Receipt

**Body:** Present this receipt at check-in and pay the amount below in cash.

- Receipt code (large, easy to read/scan visually)
- Destination / service name
- Date & time
- Number of guests
- Total amount due
- Status badge: "Awaiting Onsite Payment"

### 4.6 Staff — record onsite payment (small form/modal)

**Title:** Record Cash Payment

**Body:** Confirm this matches the tourist's receipt before recording.

- Receipt code input (to match against booking)
- Amount received (prefilled with total, editable)
- Confirm button: "Record Payment"

On success: status updates to `completed`, financial record created, brief success toast (match existing toast/confirmation patterns in the app).

---

## 5. UI/Theme Consistency Notes

- Use the existing `components/ui/modal.tsx` for all new modals — do not build a new modal primitive.
- Match existing `Button`, `Badge`, and `Card` component usage and variants already used elsewhere in the booking flow (`booking-form.tsx`, `availability-calendar-panel.tsx`).
- Status badges (`awaiting_confirmation`, `declined`, `awaiting_onsite_payment`, etc.) should follow the same pastel-chip, flat style as existing status badges (`booking-status-card.tsx`, `booking-status-donut.tsx`) — check existing color mapping before inventing new ones.
- Keep spacing compact, dividers thin, no oversized cards or gradients — consistent with the rest of the app's design language.
- The new onsite receipt view should visually echo the existing ticket page (`app/account/bookings/[id]/ticket/page.tsx`) for familiarity, even though it's a separate, simpler component.

---

## 6. Edge Cases & Validation

- A declined booking should not block the tourist from submitting a new booking for the same service/date (unless business rules say otherwise — confirm with existing duplicate-booking logic in `app/api/bookings/route.ts`).
- Existing duplicate-booking detection (Rec 3) should run at submission time, before the payment-mode modal even opens, or immediately on submit — don't let two "on hold" duplicate bookings both sit in the queue.
- Staff should not be able to record an onsite cash payment on a booking that isn't in `awaiting_onsite_payment` status — guard this server-side, not just in the UI.
- Receipt codes should be unique and unguessable enough to prevent someone from claiming another tourist's booking — short random alphanumeric is fine, but check uniqueness on generation.
- Cancelling/declining a booking that already has a `payment_mode: online` and is mid-checkout should be handled gracefully — confirm whether staff can still decline after the tourist has started (but not completed) a PayMongo session.

---

## 7. Suggested Implementation Order

1. Migration: enum values, `payment_mode` column, onsite receipt fields/table, financial record tagging.
2. `lib/types.ts`, `lib/schemas.ts`, `lib/booking-state.ts` updates.
3. Booking creation path: modal on `book/page.tsx` → `booking-form.tsx` → `app/api/bookings/route.ts`.
4. Staff confirm/decline: API route(s) + `staff-bookings-manager.tsx` UI + emails.
5. Tourist-facing status display: `app/account/current/page.tsx` branching + new onsite receipt view.
6. Staff "record onsite payment" UI + `lib/financial-records.ts` integration.
7. End-to-end test both paths (online happy path, onsite happy path, decline path) before touching anything else.

Do **not** implement the Staff GCash Account Settings feature in this pass — that's deferred.
