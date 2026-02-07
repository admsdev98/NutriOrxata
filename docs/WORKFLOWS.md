# Workflows (Baseline)

This document describes the key workflows and the acceptance criteria that define "working".

## 0) Worker registration + email verification + trial

Steps:

- Worker registers.
- Worker verifies email via token link.
- Trial starts at verification (30 days).

Acceptance criteria:

- Worker cannot access the app until verified.
- Trial remaining days are visible in-app.

## 1) Worker onboarding (first 15 minutes)

Goal: worker creates first client and assigns a first week plan quickly.

Acceptance criteria:

- Worker can register and reach the in-app dashboard.
- Worker can create a client in <= 2 minutes.
- Worker can set a calorie target and assign a week plan in <= 5 minutes using templates.

## 1.1) Trial expired (read-only) + client blocked

Steps:

- Worker signs in after trial expiration.
- Worker is forced into read-only.
- Client attempts to sign in.

Acceptance criteria:

- Worker can view, export, and delete data; cannot mutate data.
- Client cannot access; UI explains calmly why and suggests contacting the professional.

## 2) Create/edit a client

Steps:

- Create client (name + minimal required info).
- Optionally invite client (create client account) or keep as "worker-only".
- Edit profile, set active/inactive.

Acceptance criteria:

- Status is visible and filterable (active/inactive).
- No more than one "big" edit surface; avoid modal chains.

## 3) Nutrition setup and targets

Steps:

- Fill NutritionProfile (weight/height/activity; optional constraints).
- Select phase (cut/maintenance/bulk) and compute baseline target.
- Worker can choose among 3 formulas and then override the final target.

Acceptance criteria:

- The app always displays "computed" vs "final" target.
- The worker can save a target without being forced to fill optional fields.

## 4) Weekly meal planning

Steps:

- Start from DishTemplates.
- Assign dishes to days and meal slots.
- Edit a dish for a client (ingredient grams or target kcal/macro split).

Acceptance criteria:

- A worker can bulk-assign to multiple days with one action.
- Editing a plan does not unexpectedly mutate the base DishTemplate.

## 5) Routine planning and logging

Steps:

- Worker assigns a RoutineTemplate to a client.
- Client logs workouts (weights/reps, or time/distance).

Acceptance criteria:

- Client can see last values (e.g., last weight used) when logging.
- Worker can review logs without excessive scrolling.

## 6) Messaging

Steps:

- Worker and client exchange messages.
- Attachments (photos/PDF) and ephemeral audio.

Acceptance criteria:

- Clear unread state.
- Attachment upload has explicit size/type limits.

MVP constraints:

- Photos <= 5MB
- PDF <= 2MB
- Audio TTL 7 days

## 7) Progress tracking

Steps:

- Client logs weight (and optional notes) weekly.
- App shows trend charts and goal completion percentage.

Acceptance criteria:

- Charts are simple and readable on mobile.
- Goal completion is computed deterministically (no confusing "scores").

Optional (when enabled):

- Progress photos auto-delete after 90 days.
- In-app reminders at 30/15/7/1 days before deletion.

## 8) Data export and deletion

Steps:

- Worker starts an export.
- Worker downloads the ZIP.
- Worker requests deletion (tenant purge).

Acceptance criteria:

- Export works in read-only mode.
- Deletion removes active data immediately (DB + object storage).
- The product explains backup retention (encrypted, 30 days).
