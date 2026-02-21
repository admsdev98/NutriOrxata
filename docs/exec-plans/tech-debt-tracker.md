# Tech Debt Tracker

## Open Items

| ID | Area | Debt | Impact | Priority | Target Sprint |
| --- | --- | --- | --- | --- | --- |
| TD-003 | Testing | Integration coverage is still uneven across domains; tenant isolation is strong for Food but needs broader coverage as S06-S09 modules land. | High | High | S06-S09 |
| TD-004 | Operations | Missing scripted smoke checks for critical flows in `scripts/` (see `scripts/README.md`). | Medium | Medium | S10 |
| TD-006 | Security | Audit event baseline is missing for auth and critical mutation paths (without sensitive payloads). | High | High | S10-S11 |
| TD-007 | Docs/Tooling | `docs/generated/db-schema.md` is still maintained as a manual snapshot; generation automation is missing and drift risk remains. | Medium | Medium | S11 |

## Closed Items

| ID | Area | Debt | Closed In | Closure Note |
| --- | --- | --- | --- | --- |
| TD-001 | Backend | Duplicate legacy auth/core paths | Pre-S06 cleanup | Auth/core paths are consolidated under canonical modular paths in `apps/api/app/modules/` and `app/core/`. |
| TD-005 | Docs | Legacy duplicated docs trees | Pre-S06 cleanup | Canonical docs structure is centralized in `docs/` with indexes and no active duplicate trees. |

## Rules

- Every sprint must close or re-scope at least one debt item.
- Closed items must be moved out of Open Items and reflected in sprint closure notes.
