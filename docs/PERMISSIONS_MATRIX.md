# Permissions Matrix (MVP)

This document defines who can do what, and what happens in special access states.

Roles:

- Worker: tenant owner (the professional).
- Client: invited by a worker; belongs to a tenant.

States:

- Active tenant: normal operations.
- Tenant expired:
  - Worker: read-only.
  - Client: blocked.

Important:

- Enforcement must be server-side. UI is not a security boundary.

## 1) Access states

| State | Worker | Client |
|---|---|---|
| Not verified email | blocked | n/a |
| Trial active | full access | normal |
| Trial expired | read-only (view/export/delete only) | blocked (calm explanation) |
| Disabled/suspended | blocked | blocked |

## 2) Core capabilities

Legend: R = read, W = write, X = delete

| Resource | Worker | Client |
|---|---|---|
| Tenant profile/settings | R/W | R (only own language/timezone, if any) |
| Clients list | R/W/X | n/a |
| Client detail (profile) | R/W | R |
| Custom fields | R/W/X | R |
| Nutrition profile | R/W | R |
| Calorie targets | R/W | R |
| Ingredients library | R/W/X | R (only through plan views, not library UI) |
| Dish templates | R/W/X | R (as assigned in plan) |
| Weekly plan | R/W | R (today/week) |
| Plan edits | R/W | log only (no edits to worker plan) |
| Training templates | R/W/X | R (as assigned) |
| Training assignment | R/W | R |
| Workout logging | R | R/W (own logs) |
| Messages | R/W | R/W |
| Message attachments | R/W | R/W (limits apply) |
| Audio messages | R/W | R/W (limits apply) |
| Progress check-ins (weight) | R/W | R/W (own check-ins) |
| Progress photos | R/W | R/W (own uploads if enabled) |
| Work planner items | R/W/X | n/a |
| Export ZIP | R/W (create/download) | n/a |
| Delete my data (tenant purge) | R/W (initiate) | n/a |

## 3) Read-only (trial expired)

Worker can:

- read all tenant data
- request export and download export
- initiate tenant purge

Worker cannot:

- create/update/delete any domain entity
- send messages
- upload any media
- invite clients

Client:

- cannot access any screen
- sees a calm explanation and next step
