# S03/S04 Verification Notes (2026-02)

This note records the verification performed for the S03 worker workspace shell and the S04 nutrition targets increment.

## What was verified

### S03 - Worker workspace shell

- Worker shell loads in the dev stack and serves the worker route surface.
- URL state patterns are present (`tab`, `mode`, `demo`, `debug`).
- Blocked/read-only banners are explicit in the UI.

### S04 - Nutrition inputs and targets

- Nutrition calculator unit tests pass.
- End-to-end API smoke works: register -> verify -> login -> put profile -> get targets.
- Unauthorized access returns deterministic 401 `missing_token`.

## Commands used

Backend unit tests:

```bash
docker exec nutriorxata-v1-api-1 python -m unittest discover -s tests -p 'test_*.py' -v
```

Health checks:

```bash
curl -sS http://localhost:8010/api/health
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:5173/
```

Nutrition endpoints (unauthenticated):

```bash
curl -sS -i http://localhost:8010/api/nutrition/profile/me
curl -sS -i http://localhost:8010/api/nutrition/targets/me
```

## Follow-ups

- Consider splitting the S03 visual checklist into a repeatable scripted smoke path (target: S10).
- Ensure sprint completion checklists are kept in sync with actual verification.
