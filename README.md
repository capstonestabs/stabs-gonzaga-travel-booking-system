# Smart Tourism Assistance and Booking System (STABS)

STABS is a web-based tourism destination platform for Gonzaga, Cagayan. It allows guests to browse destinations, services, pricing, photos, and contact details; tourists to book online services and manage tickets; staff to manage assigned destinations; and admin to manage accounts and payout records.

## Core Flow

1. Guests browse destinations and service packages.
2. Tourists sign up or sign in when ready to reserve.
3. The system checks service availability and creates a short slot hold.
4. The tourist completes GCash checkout through PayMongo.
5. Successful payment confirms the booking and issues a ticket.
6. Staff manage the destination, services, calendars, and booking completion.
7. Admin manages staff, tourist accounts, and payout history.

## Main Features

- Public destination browsing
- Service-based online booking
- Walk-in destination mode
- Tourist email verification and password recovery
- GCash payment via PayMongo
- Booking history, booking calendar, and ticket wallet
- Staff destination and service management
- Service date windows and closure calendar
- Admin payout tracking and payout history

Full feature details: [FEATURES.md](/c:/Users/Admin/Desktop/STABS/docs/FEATURES.md)

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, and Storage
- PayMongo
- Brevo SMTP
- Vercel

Full stack details: [TECH_STACK.md](/c:/Users/Admin/Desktop/STABS/docs/TECH_STACK.md)

## Project Docs

- System description: [PROJECT_DESCRIPTION.md](/c:/Users/Admin/Desktop/STABS/docs/PROJECT_DESCRIPTION.md)
- Features: [FEATURES.md](/c:/Users/Admin/Desktop/STABS/docs/FEATURES.md)
- Tech stack: [TECH_STACK.md](/c:/Users/Admin/Desktop/STABS/docs/TECH_STACK.md)
- Updated manuscript draft: [STABS_Updated_Manuscript_Draft.md](/c:/Users/Admin/Desktop/STABS/docs/STABS_Updated_Manuscript_Draft.md)

## Local Development

### Requirements

- Node.js
- npm
- Supabase project
- PayMongo test credentials

### Environment Variables

Set these in `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=media
PAYMONGO_SECRET_KEY=...
PAYMONGO_WEBHOOK_SECRET=...
```

Note:
- `PAYMONGO_WEBHOOK_SECRET` is only needed once a real webhook is created.
- Brevo SMTP is configured in Supabase Auth, not in the app env.

### Install and Run

```bash
npm install
npm run dev
```

### Build Checks

```bash
npm run typecheck
npm test
npm run build
```

## Deployment Notes

- Production URL: `https://stabs.vercel.app`
- Supabase redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://stabs.vercel.app/auth/callback`
- PayMongo webhook endpoint:
  - `https://stabs.vercel.app/api/payments/webhook`

## Status

STABS is implemented as a capstone-ready full-stack tourism booking system for Gonzaga, Cagayan, with guest, tourist, staff, and admin workflows already in place.
