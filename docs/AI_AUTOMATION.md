# AI + Automation

AI is optional and must not compromise trust or safety.

## 1) FAQ bot (n8n)

Objective:

- Provide a simple help flow for common questions.

Rules:

- Prefer deterministic answers from curated FAQ first.
- Escalate to support form when confidence is low.

## 2) AI-assisted creation (Pro)

Candidate flows:

- Generate draft dishes based on target calories/macros and constraints.
- Suggest ingredient substitutions (allergies/preferences).
- Generate routine templates based on sport, frequency, and equipment.

Guardrails:

- Always label AI output as draft.
- Worker must approve before assigning to a client.
- Keep prompts and output structured (schemas) to avoid hallucinated fields.

## 3) What AI must NOT do

- Provide medical diagnosis.
- Override worker decisions.
- Message clients automatically without worker opt-in.
