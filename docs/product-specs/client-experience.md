# Client Experience

## Goal

Give clients a clear daily execution surface for meals, training, progress, and messaging.

## Primary Flows

- View assigned weekly plan with current day highlighted.
- Log activity and adherence.
- Track progress and communicate with worker.

## Current Delivered Baseline

- Route: `/client/weekly-plan`.
- Read-only weekly plan lookup by `client_ref + week_start_date`.
- Client can open any assigned slot and inspect dish details and notes.
- No client-side mutation is allowed in this baseline.

## Constraints

- Keep flow simple and mobile-first.
- Hide worker-only complexity.
- Block access when tenant is expired or disabled.

## Acceptance Criteria

- Client can identify next action on first screen.
- State messaging for blocked access is calm and clear.
- Client can read assigned weekly slots and inspect detail in one tap from the list.
