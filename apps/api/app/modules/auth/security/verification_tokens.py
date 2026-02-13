from __future__ import annotations

import hashlib
import secrets


def new_token_urlsafe(nbytes: int = 32) -> str:
    return secrets.token_urlsafe(nbytes)


def token_hash_bytes(raw_token: str) -> bytes:
    # Store hashes, never raw tokens.
    return hashlib.sha256(raw_token.encode("utf-8")).digest()
