# Project Description

## Smart Tourism Assistance and Booking System (STABS)

STABS is a web-based tourism booking and destination management system developed for Gonzaga, Cagayan. The system centralizes destination browsing, service package presentation, online reservation, tourist account management, staff-side destination operations, and admin-side payout monitoring.

The platform is designed to solve common issues in local tourism operations such as fragmented inquiries, manual booking confirmation, inconsistent destination updates, and lack of centralized records. Instead of requiring tourists to contact multiple destination operators through separate channels, STABS provides one platform for browsing destination information, checking services, reviewing pricing, and completing online reservations for supported destinations.

The system supports four main roles:

- **Guest**: browses public destination pages without creating an account
- **Tourist**: registers, books services, pays online, and manages tickets and booking records
- **Staff**: manages one assigned destination, its services, media, and bookings
- **Admin**: manages accounts and monitors destination payout records

STABS also supports two destination modes:

- **Online booking**
  - tourists can reserve services using a visual calendar and GCash checkout
- **Walk-in**
  - the system shows services, prices, and contact details, but booking happens outside the platform

The implemented system focuses on actual Gonzaga destination operations rather than broader travel aggregation. It does not include airline booking, third-party hotel networks, or multi-country travel services. Its scope is intentionally local, practical, and aligned with the workflow used by Gonzaga destinations.

## Main Operational Flow

1. A guest browses destinations and service packages.
2. A tourist signs in only when ready to reserve.
3. The system checks service capacity and date availability.
4. A short slot hold is created before payment.
5. The tourist pays using PayMongo GCash.
6. Successful payment confirms the booking and issues a ticket.
7. Staff monitor and complete bookings for their assigned destination.
8. Admin monitors active payout records and payout history.

## Intended Value

STABS aims to:

- improve destination visibility in Gonzaga
- reduce manual booking coordination
- protect service capacity from overbooking
- give tourists a clearer booking process
- give staff a cleaner destination management workflow
- give admin a structured payout monitoring process
