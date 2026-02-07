# Domain Model (Draft)

This is a conceptual model to keep naming consistent across backend and frontend.

## 1) Multi-tenant scoping (non-negotiable)

- Every worker is a tenant.
- Every entity that belongs to a worker MUST be scoped by `tenant_id` (or equivalent).
- Client accounts are created/invited by a worker; clients cannot access data outside their tenant.

## 2) Core entities

Worker/Tenant:

- WorkerAccount: auth identity for a worker.
- Tenant: owning scope for all data (often 1:1 with WorkerAccount, but kept explicit).

Client:

- ClientAccount: auth identity for a client (optional until invited).
- ClientProfile: name, contact, status (active/inactive), metadata.
- NutritionProfile: anthropometrics, activity, constraints.
- CustomField: extra key/value fields defined by worker (guardrailed).

Food:

- Ingredient: per-100g nutrition.
- DishTemplate: composed of ingredients (with grams per ingredient).
- DishInstance (optional): a copy of a dish used in a specific plan that can be edited without changing the template.
- WeekPlan: for a client, contains days and meal slots.

Training:

- RoutineTemplate: sport/gym routine definition.
- RoutineAssignment: attaches routine to a client.
- WorkoutLog: entries created by client.

Messaging:

- Conversation: worker-client thread.
- Message: text content + metadata.
- Attachment: file/link/audio reference.

Access / subscription (MVP):

- EmailVerificationToken: worker verification flow.
- TrialState: trial start and end timestamps.
- SubscriptionState: manual unlock flag and status.

Ops:

- Job: background jobs (export ZIP generation, TTL deletions, reminders).
- Export: export request + generated artifact metadata.

Storage:

- MediaObject: metadata for objects stored in S3-compatible storage (path, size, mime, TTL, owner scope).

Tracking:

- Goal: e.g. target weight or performance.
- CheckIn: periodic snapshot (weight, notes, compliance, etc).

## 3) Relationship sketch

```text
Tenant
  - has many Clients
  - has many Ingredients, DishTemplates, RoutineTemplates

Client
  - has one ClientProfile
  - has one NutritionProfile
  - has many WeekPlans
  - has many RoutineAssignments
  - has one Conversation with the Worker (or many if we ever support multiple threads)
  - has many CheckIns and WorkoutLogs
```

## 4) Notes / open questions

- DishInstance: do we need per-client/per-week copies, or can we model edits as overrides?
- ClientAccount: do we require clients to have an email/password, or can we support magic links?
- Attachments/audio: retention policy and storage backend.

Decisions (locked for MVP):

- Client auth: invite -> confirm email -> set password.
- Audio TTL: 7 days.
- Progress photo TTL: 90 days.
- Backups retention: 30 days (encrypted).
