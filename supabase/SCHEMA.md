# Supabase Schema Guide

## Database Files

The consolidated schema is:

- [current_schema.sql](/c:/Users/Admin/Desktop/STABS/supabase/current_schema.sql)

This file is the complete database definition for a fresh STABS installation. Forward migrations in `supabase/migrations` update existing deployments without rebuilding their databases.

## What It Contains

The final schema includes the tables, types, functions, triggers, indexes, and policies used by the current app:

- users
- staff_profiles
- destinations
- destination_images
- destination_services
- bookings
- payments
- feedback_entries
- booking_slot_locks
- booking_guest_visits
- financial_records
- service_availability_closures

It also includes:

- enum types used by the app
- updated triggers for `updated_at`
- service-based availability SQL functions
- row-level security policies used by the current system
- indexes aligned with the present booking and payout flow

## Removed Legacy Structures

Obsolete database parts that are no longer part of the current app are cleaned up in the final schema, such as:

- `destination_availability_windows`
- `destination_availability_overrides`
- old destination-wide capacity functions
- old PayMongo fee breakdown columns no longer used by the current admin UI

## Usage

Use `current_schema.sql` when:

- setting up a fresh Supabase database
- aligning a development database with the current STABS structure
- reviewing the complete database structure in one file

## Important Note

The schema file reflects the current implemented app logic, not every old historical table or transition from removed features.

If you export a raw schema snapshot directly from Supabase, it may still include outdated objects from earlier development stages. For the STABS project, `current_schema.sql` is the file that should be treated as the current final schema.
