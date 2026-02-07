# Auth, Verification, Trial, and Access Gate

This document defines the MVP access model.

## 1) Roles

- Worker: tenant owner (the professional).
- Client: invited by a worker, belongs to the worker tenant.

## 2) Email verification (worker)

- A worker cannot access the app until their email is verified.
- Verification is done via a signed token link.

## 3) Trial

- Trial starts when the worker verifies their email.
- Default trial length: 30 days.

## 4) Trial expired behavior

Worker:

- The worker can sign in but is forced into read-only mode.
- Read-only allows:
  - viewing data
  - exporting data
  - deleting their data (tenant purge)
- Read-only blocks:
  - any create/update/delete
  - invites
  - messaging
  - uploads

Client:

- Clients cannot access the app while the tenant is expired.
- The UI must show a calm, non-aggressive explanation and a suggestion to contact the professional.

## 5) Payment (MVP)

- No automated billing in MVP.
- A manual unlock flag is sufficient (admin/support action).

## 6) Client invites

- Invite links expire in 24 hours.
- Client flow:
  - open invite
  - confirm email
  - set password
  - sign in

## 7) Transactional email provider

- Use SendGrid (provider must be configurable by environment variables).
