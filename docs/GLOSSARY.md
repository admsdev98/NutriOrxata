# Glossary

This document defines the domain terms used across the project.

## Roles

- Worker: nutritionist/trainer who owns the client relationship and manages plans.
- Client: end user invited/created by a worker; consumes plans and logs progress.
- Admin (future): platform operator (billing, branding, moderation).

## Scoping

- Tenant: the worker boundary. A tenant owns all their clients and libraries.
- Library: reusable content owned by a tenant (ingredients, dishes, routines).

## Nutrition

- Ingredient: food item with nutrition data per 100g (kcal, protein, carbs, fat).
- Dish (template): reusable recipe definition composed of ingredients.
- Dish (client variant): a dish adapted for a specific client/week (optional concept).
- Meal slot: a place in the week plan (e.g., breakfast, lunch, dinner, snack).
- Weekly plan: the week structure for a client (days, meals, dishes).
- Calorie target: intended daily kcal (and optionally macros) for a period.

## Training

- Routine (template): reusable training plan definition.
- Routine assignment: a routine attached to a client for a period.
- Workout log: client-recorded performance (weights, reps, time, distance, notes).

## Communication

- Conversation: worker-client thread.
- Attachment: shared file/link (and optional ephemeral audio).

## Access and billing (MVP)

- Email verification: required step for a worker before they can access the app.
- Trial: time-limited access window (30 days from worker verification).
- Read-only: restricted mode after trial expiration (view/export/delete only).
- Manual unlock: support/admin action that re-enables full access without automated billing.

## Data lifecycle

- TTL (time to live): automatic deletion after a fixed period.
- Signed URL: time-limited URL to download/upload an object from storage.
- Export ZIP: downloadable archive of tenant data + media.
- Tenant purge: deletion of all tenant data from active systems.

## Tracking

- Check-in: periodic (usually weekly) status update captured from client.
- Goal: target outcome (e.g., weight change, performance milestone).
- Adherence: how closely the client followed the plan (simplified metrics).
