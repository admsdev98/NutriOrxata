# Email Delivery (SendGrid)

Email delivery must remain portable across hosting providers.

## 1) Provider

- Use SendGrid for MVP.
- Provider must be configurable via environment variables.

## 2) Transactional templates

Required templates:

- Worker email verification
- Password reset
- Client invite (24-hour expiration)

## 3) Domain configuration

To avoid spam issues:

- SPF
- DKIM
- DMARC

## 4) Deliverability notes

- Use a dedicated sender domain if possible.
- Avoid sending from free mailbox domains.
