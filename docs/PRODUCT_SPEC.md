# Product Spec (Baseline)

This document describes the core product sections, how they should work, and the constraints.

## 1) Main sections

- Landing (home)
- Auth (login/registration/password reset)
- App (worker + client areas)

Reference docs:

- `docs/WORKFLOWS.md`
- `docs/GLOSSARY.md`
- `docs/FORMULAS_CALORIC_TARGETS.md`

## 2) Landing

Objective:

- Explain in < 60 seconds what the product does and why it is better than spreadsheets.

Rules:

- Clear, short copy. One primary CTA.
- Show the 2-sided nature: worker app + client app.
- Focus on efficiency, clarity, and reusability.

## 3) Auth

Objective:

- Workers can register.
- Workers and clients can log in.
- Password recovery works.

MVP access gate:

- Worker cannot access the app until email is verified.
- Trial starts at verification and lasts 30 days.
- Trial expired: worker is read-only; clients cannot access.
- Read-only always allows export and delete my data.

Rules:

- If a client is created by a worker, client onboarding must be simple.
- Keep flows short and mobile-friendly.

Reference:

- `docs/AUTH_TRIAL_SUBSCRIPTION.md`

## 4) In-app (worker)

Navigation rule:

- The worker app optimizes for speed and density, but must remain calm.
- Prefer a left navigation with predictable sections.

### 4.1 Dashboard

Objective:

- Act as a corkboard: what happened, what is happening, what to do next.

Must show (minimal):

- Upcoming tasks/appointments (daily/weekly/monthly).
- Alerts: missing check-ins, unanswered messages, plan not assigned.
- Quick actions: add client, assign week plan, message.

Rules:

- Avoid irrelevant charts.
- Avoid scrolling.

### 4.2 Clients (list)

Objective:

- Create / edit / deactivate clients.

Rules:

- Search + filters.
- Status visible (active/inactive).

### 4.3 Client detail (the main workspace)

This is the core surface. It must allow a worker to manage a client quickly.

Required capabilities:

1) Create/edit client info; activate/deactivate.
2) Nutrition profile:
   - Required: height, weight, activity level.
   - Optional: allergies, diseases, preferences/avoidances.
   - Custom fields: allow adding extra fields up to a limit.
3) Caloric targets per week (or per visit):
   - Phase: cut/maintenance/bulk.
   - Use 3 well-known formulas (worker can pick baseline result), then allow manual override.
4) Weekly menu planning:
   - Start from base dishes and adapt.
   - Assign to specific day(s) or whole week.
   - Edit dish ingredients per client when needed.
   - Support editing by final calories or by macro percentages (P/C/F).
   - Macro-optimized mode is a competitive advantage and is Phase 1.
   - Ingredient-level lock/unlock is required to avoid breaking recipes.
5) Assign exercise routines:
   - Pick from routine library.

Recommended tabs (baseline):

- Overview (alerts + next actions)
- Profile (client info + status)
- Nutrition (inputs + targets)
- Menu (weekly plan)
- Training (routine assignment)
- Progress (charts + check-ins)
- Messages

UX rules:

- Use panels/tabs (Profile / Nutrition / Menu / Training / Progress / Messages).
- Inline editing over modal chains.
- Worker should reach any of the above in <= 3 clicks.

### 4.4 Messages

Objective:

- Internal chat between worker and client.

Capabilities:

- Text messages.
- Attachments: photos and PDF (MVP).
- Temporary audio messages (ephemeral): yes (MVP).

Rules:

- Clear unread state.
- Fast on mobile.
- Explicit constraints for attachments (size/type) and retention.

MVP constraints:

- Photos: <= 5MB
- PDF: <= 2MB
- Audio duration: worker <= 120s, client <= 60s
- Audio retention: TTL 7 days

### 4.5 Ingredients

Objective:

- Create/edit/delete ingredients.

Data rules:

- Store per 100g: kcal + basic macros (protein/carbs/fat).

Nice-to-have later:

- Units and serving sizes (only if it does not increase friction).

### 4.6 Dishes

Objective:

- Create reusable base dishes.

Rules:

- A dish can be used for one or multiple meals.
- Dishes should be easy to copy and adapt per client.
- The product must clarify when edits affect the template vs only the current plan.

### 4.7 Routines

Objective:

- Create reusable routines (not only gym).

Rules:

- Support progressions and notes.
- For gym: weights/reps and history.
- For running: time, distance, pace.

Minimum logging UX:

- Show last logged value per exercise/activity.
- Logging must be possible in < 30 seconds on mobile.

### 4.8 Profile (settings)

Objective:

- Basic account settings.

### 4.9 Help

Objective:

- Basic FAQ and a support contact form.

## 5) In-app (client)

Client should open the app and immediately see:

- Weekly meal plan (today highlighted).
- Ability to log/adjust within allowed rules.
- Calories/macros progress (done vs remaining).
- Training routine for the day/week and history logging.
- Messaging with the worker.

Client permissions (baseline):

- Client can log what happened (meals/workouts/weight).
- Client cannot modify the worker's templates.
- Client adjustments to the plan (if allowed) must be explicit and visible to the worker.

Tenant expired behavior:

- Client cannot access while the worker tenant is expired.
- Show a calm, non-aggressive message that explains why and suggests contacting the professional.

Rules:

- Mobile-first.
- Keep it simple: do not expose worker-only complexity.

## 6) Data export and deletion

MVP guarantee:

- Worker can export data as a ZIP.
- Worker can delete their data (tenant purge).
- Both are available even during read-only.

Reference:

- `docs/DATA_EXPORT_AND_DELETION.md`

## 7) Premium / Pro (future)

Candidate pro features:

- AI-assisted generation of dishes/ingredients/routines (guardrailed).
- Branding customization: client app typography/colors (basic theming).
- Advanced analytics and charts.

Also consider:

- Worker-specific libraries sharing (opt-in) inside a tenant team (future).
