# Product Spec (Baseline)

This document describes the core product sections, how they should work, and the constraints.

## 1) Main sections

- Landing (home)
- Auth (login/registration/password reset)
- App (worker + client areas)

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

Rules:

- If a client is created by a worker, client onboarding must be simple.
- Keep flows short and mobile-friendly.

## 4) In-app (worker)

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
   - Optional: dish has a target kcal so it can auto-recalculate.
5) Assign exercise routines:
   - Pick from routine library.

UX rules:

- Use panels/tabs (Profile / Nutrition / Menu / Training / Progress / Messages).
- Inline editing over modal chains.
- Worker should reach any of the above in <= 3 clicks.

### 4.4 Messages

Objective:

- Internal chat between worker and client.

Capabilities:

- Text messages.
- Attachments (files/links).
- Temporary audio messages (ephemeral) if feasible.

Rules:

- Clear unread state.
- Fast on mobile.

### 4.5 Ingredients

Objective:

- Create/edit/delete ingredients.

Data rules:

- Store per 100g: kcal + basic macros (protein/carbs/fat).

### 4.6 Dishes

Objective:

- Create reusable base dishes.

Rules:

- A dish can be used for one or multiple meals.
- Dishes should be easy to copy and adapt per client.

### 4.7 Routines

Objective:

- Create reusable routines (not only gym).

Rules:

- Support progressions and notes.
- For gym: weights/reps and history.
- For running: time, distance, pace.

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

Rules:

- Mobile-first.
- Keep it simple: do not expose worker-only complexity.

## 6) Premium / Pro (future)

Candidate pro features:

- AI-assisted generation of dishes/ingredients/routines (guardrailed).
- Branding customization: client app typography/colors (basic theming).
- Advanced analytics and charts.
