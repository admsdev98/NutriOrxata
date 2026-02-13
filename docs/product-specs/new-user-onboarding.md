# New User Onboarding

## Worker Onboarding

1. Worker registers with email and password.
2. Worker verifies email from transaction link.
3. Trial starts on successful verification.
4. Worker accesses the app in active mode.

## Client Onboarding

1. Worker creates or invites client.
2. Client receives access path.
3. Client can log in and access assigned plans.

## Constraints

- Unverified worker cannot access app.
- Expired trial moves worker to read-only and blocks clients.

## Acceptance Criteria

- Registration and verification flows must return deterministic errors.
- Access state transitions must be explicit and testable.
