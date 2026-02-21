# S00 Docs Harness and Architecture Map

**Status:** Completed

References:

- `docs/exec-plans/active/2026-02-v1-sprint-breakdown.md`
- `docs/README.md`
- `ARCHITECTURE.md`
- `AGENTS.md`

## Goals

- Establish one canonical documentation tree and entry points.
- Publish a map-first architecture reference for engineering boundaries.
- Keep Spanish content as non-canonical human summary only.

## Delivery Checklist

- [x] Canonical docs index exists at `docs/README.md`.
- [x] Top-level architecture map exists at `ARCHITECTURE.md`.
- [x] Agent operating contract is centralized in `AGENTS.md`.
- [x] Spanish human summary is published at `docs/HUMAN_OVERVIEW.es.md`.
- [x] Legacy duplicated docs trees were removed from active canonical paths.

## Verification Checklist

Documentation surface:

- [x] `ls docs` shows canonical root docs plus `HUMAN_OVERVIEW.es.md`.
- [x] `docs/README.md` points to canonical indexes (`product-specs`, `design-docs`, `exec-plans`).
- [x] `ARCHITECTURE.md` and `AGENTS.md` align on layering and documentation contract.

## Notes / Known gaps

- No blocking gaps for S00 were found during the pre-S06 cleanup.
