from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def parse_cors_origins(raw: str) -> list[str]:
    raw = (raw or "").strip()
    if not raw:
        return []
    return [o.strip() for o in raw.split(",") if o.strip()]


def register_cors(app: FastAPI, raw_origins: str) -> None:
    origins = parse_cors_origins(raw_origins)
    if not origins:
        return

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
