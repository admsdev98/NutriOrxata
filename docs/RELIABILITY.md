# Reliability Baseline

## Runtime Baseline

- Local orchestration: `infra/compose/dev.yml`.
- Production orchestration: `infra/compose/prod.yml`.
- Reverse proxy: Caddy.
- Data services: Postgres and MinIO.

## Reliability Invariants

- Backups must be encrypted.
- Minimum retention target is 30 days.
- Restore path must remain documented and testable.
- Core API health endpoint must stay available.

## Operational Controls

- Service startup order with health checks.
- Container restart policies for long-running services.
- Private network boundaries for data services.

## Next Reliability Improvements

- Add scripted smoke verification in `scripts/`.
- Add recurring backup restore rehearsal cadence.
- Add lightweight metrics baseline and alerting policy.
