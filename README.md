# Smart Tourism Assistance and Booking System (STABS)

> A web-based tourism destination platform for Gonzaga, Cagayan.

STABS centralizes public destination browsing, service-based reservations, tourist account management, staff-side destination operations, and admin-side payout monitoring in one system. It is designed for local tourism destinations that need a clear online booking flow, structured destination management, and role-based access for guests, tourists, staff, and admin.

## Overview

STABS helps:

- guests browse destinations, prices, services, photos, and contact details
- tourists reserve services online and manage tickets and booking records
- staff manage one assigned destination and its service offerings
- admin manage accounts and monitor payout records and payout history

The system supports both:

- `online` destinations for service-based reservations with GCash checkout
- `walk-in` destinations for contact-only viewing without online booking

## Quick Links

- [Project Description](./docs/PROJECT_DESCRIPTION.md)
- [Features](./docs/FEATURES.md)
- [Tech Stack](./docs/TECH_STACK.md)
- [Updated Manuscript Draft](./docs/STABS_Updated_Manuscript_Draft.md)
- [Supabase Schema Guide](./supabase/SCHEMA.md)

## System Highlights

| Area | What STABS Provides |
|---|---|
| Public access | Destination browsing, services, pricing, gallery, contact details |
| Tourist flow | Sign up, email verification, password recovery, booking, tickets |
| Booking logic | Service-based availability, date windows, slot hold, booking confirmation |
| Payment | PayMongo checkout with GCash |
| Staff tools | Destination profile, services, media, calendars, booking completion |
| Admin tools | Staff management, tourist account management, payout workspace, payout history |

## Core User Flow

1. Guests browse destinations and service packages.
2. Tourists sign in only when ready to reserve.
3. The system checks service availability and creates a short slot hold.
4. The tourist completes GCash checkout through PayMongo.
5. Successful payment confirms the booking and issues a ticket.
6. Staff manage the destination, services, calendars, and booking completion.
7. Admin manages accounts, payouts, and payout history.

## Roles

### Guest

- Browse destinations, services, prices, photos, and contact details
- View walk-in destination information
- Cannot book or proceed to payment

### Tourist

- Create an account and confirm email
- Recover password by email
- Book online services
- View booking status, dashboard, history, calendar, and tickets

### Staff

- Manage one assigned destination
- Edit services, pricing, service dates, and closures
- Monitor and complete bookings

### Admin

- Create and manage staff accounts
- Manage tourist accounts
- Record payouts and maintain payout history

## Main Features

- Public destination listings and destination detail pages
- Visual service availability calendar
- Walk-in destination mode
- Tourist dashboard, booking history, and ticket wallet
- Tourist-only email verification and password recovery
- Staff destination and service management
- Service start and end dates
- Service closure calendar
- Booking tickets after successful payment
- Admin payout workspace and payout history

See the full breakdown in [FEATURES.md](./docs/FEATURES.md).

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, Lucide React, react-day-picker |
| Backend | Next.js App Router, Route Handlers |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payment | PayMongo |
| Email | Brevo SMTP through Supabase Auth |
| Deployment | Vercel |

More details: [TECH_STACK.md](./docs/TECH_STACK.md)

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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=media
PAYMONGO_SECRET_KEY=
PAYMONGO_WEBHOOK_SECRET=
```

Notes:

- `PAYMONGO_WEBHOOK_SECRET` is only needed after creating a real PayMongo webhook.
- Brevo SMTP is configured in Supabase Auth, not in the app environment file.

### Install and Run

```bash
npm install
npm run dev
```

### Validation Commands

```bash
npm run typecheck
npm test
npm run build
```

## Working With Code Changes

### If There Are New Code Changes

Use this flow when the repository has already been updated and you want the latest code on your machine:

```bash
git pull origin main
npm install
npm run typecheck
npm run build
```

Use `npm install` after pulling so any package changes in `package.json` or `package-lock.json` are applied locally.

Recommended check after pulling:

```bash
git status
```

This helps confirm whether your working tree is clean before you start editing.

### How to Commit and Push Changes

After editing the code:

```bash
git status
git add .
git commit -m "Describe your changes here"
git push origin main
```

Recommended commit message style:

- `Fix sign-out confirmation flow`
- `Refine tourist sign-up copy`
- `Improve mobile workspace navigation`

### How to Connect Your GitHub Account in VS Code Terminal

Make sure Git uses the same GitHub account name and email that own the repository.

Example:

```bash
git config user.name "capstonestabs"
git config user.email "your_verified_github_email@example.com"
```

To check the current Git identity in the terminal:

```bash
git config user.name
git config user.email
```

If you use VS Code:

1. Sign in to GitHub in VS Code.
2. Open the project folder.
3. Open the integrated terminal.
4. Set your Git name and Git email using the commands above.
5. Push normally from the terminal.

If GitHub asks you to choose an account, use the same GitHub account that owns this repository:

- Repository owner: `capstonestabs`
- Repository: `stabs-gonzaga-travel-booking-system`

You can also verify the connected remote:

```bash
git remote -v
```

Expected remote:

```bash
origin  https://github.com/capstonestabs/stabs-gonzaga-travel-booking-system.git (fetch)
origin  https://github.com/capstonestabs/stabs-gonzaga-travel-booking-system.git (push)
```

## Supabase Setup

The project now keeps one consolidated schema file:

- [current_schema.sql](./supabase/current_schema.sql)

Reference guide:

- [SCHEMA.md](./supabase/SCHEMA.md)

## Deployment Notes

- Production URL: `https://stabs-sable.vercel.app`
- Supabase redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://stabs-sable.vercel.app/auth/callback`
- PayMongo webhook endpoint:
  - `https://stabs-sable.vercel.app/api/payments/webhook`

## Current Scope

Included:

- Gonzaga destination browsing
- service-based online reservations
- GCash checkout
- staff destination operations
- admin payout tracking

Not included:

- refund workflow
- cancellation after successful payment
- airline booking
- external hotel marketplace aggregation
- admin-created offline walk-in bookings

## Status

STABS is implemented as a capstone-ready full-stack tourism booking system focused on Gonzaga, Cagayan, with guest, tourist, staff, and admin workflows already in place.
