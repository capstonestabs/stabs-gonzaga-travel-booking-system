# Tech Stack

## Frontend

- **Next.js 15**
  - App Router
  - Server Components
  - Route Handlers
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Lucide React**
- **react-day-picker**

## Backend

- **Next.js Route Handlers**
  - REST-style API endpoints inside `app/api`
- **Server-side business logic**
  - repository-based data access in `lib/repositories.ts`
  - availability and booking logic in `lib/availability.ts`
  - payment handling in `lib/paymongo.ts` and `lib/payment-sync.ts`

## Database and Platform Services

- **Supabase PostgreSQL**
  - users
  - staff profiles
  - destinations
  - destination services
  - bookings
  - payments
  - financial records
  - booking slot locks
  - feedback entries
- **Supabase Auth**
  - tourist sign-up and sign-in
  - email verification
  - password recovery
  - admin-created staff accounts
- **Supabase Storage**
  - avatars
  - cover images
  - destination gallery
  - service images

## Payment

- **PayMongo**
  - GCash checkout
  - booking confirmation after successful payment
  - webhook-ready payment sync

## Email

- **Brevo SMTP through Supabase Auth**
  - tourist email verification
  - tourist password recovery

## Deployment

- **Vercel**
  - production app hosting
  - production URL: `https://stabs.vercel.app`

## Development Tools

- **Visual Studio Code**
- **npm**
- **Vitest**
- **TypeScript compiler**

## Current Project Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

## Environment Configuration

Main app environment variables:

```env
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=
PAYMONGO_SECRET_KEY=
PAYMONGO_WEBHOOK_SECRET=
```

## Architecture Summary

- Browser client for public and role-based UI
- Next.js app for pages and APIs
- Supabase for auth, database, and storage
- PayMongo for payment confirmation
- Brevo SMTP through Supabase Auth for email delivery
- Vercel for deployment
