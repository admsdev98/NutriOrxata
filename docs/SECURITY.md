# Security and Data Lifecycle

## Security Invariants

- No secrets committed to git.
- Server-side authorization is mandatory.
- Tenant isolation is mandatory in all domain data access.
- Data minimization by default.

## Access States

- Worker not verified: blocked.
- Trial active: normal access.
- Trial expired: worker read-only, client blocked.
- Disabled tenant: blocked.

## Data Lifecycle

- Data export must remain available.
- Tenant deletion flow must remain available.
- Retention rules must be explicit for media and backups.

## Backend Requirements

- Validate identity and tenant scope on every protected route.
- Review indexes for high-frequency and tenant-filtered queries.
- Record security-relevant audit events without storing sensitive payloads.
