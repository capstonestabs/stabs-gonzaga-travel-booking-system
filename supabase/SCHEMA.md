# Supabase Schema Guide

## Final Database File

The `supabase` folder now keeps only one executable SQL file:

- [current_schema.sql](/c:/Users/Admin/Desktop/STABS/supabase/current_schema.sql)

This file is the consolidated database definition for the current STABS application. It replaces the old incremental migration chain and is intended to be the single schema reference going forward.

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
- financial_records
- service_availability_closures

It also includes:

- enum types used by the app
- updated triggers for `updated_at`
- service-based availability SQL functions
- row-level security policies used by the current system
- indexes aligned with the present booking and payout flow

## What Was Removed

Old migration files were removed because they are now merged into the final schema file.

Obsolete database parts that are no longer part of the current app are also cleaned up in the final schema, such as:

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
