from __future__ import annotations

import httpx

from app.core.config import settings


def send_email(*, to_email: str, subject: str, html: str) -> None:
    # MVP: if SendGrid not configured, do nothing.
    if not settings.sendgrid_api_key or not settings.sendgrid_from_email:
        return

    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": settings.sendgrid_from_email},
        "subject": subject,
        "content": [{"type": "text/html", "value": html}],
    }

    headers = {
        "Authorization": f"Bearer {settings.sendgrid_api_key}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=10.0) as client:
        res = client.post("https://api.sendgrid.com/v3/mail/send", json=payload, headers=headers)
        if res.status_code >= 400:
            # Avoid leaking provider responses.
            raise RuntimeError("sendgrid_failed")
