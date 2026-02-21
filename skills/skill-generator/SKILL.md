---
name: skill-generator
description: Interactive wizard for creating new high-quality agent skills. Ensures strict adherence to project standards, directory structure, and registration in AGENTS.md.
trigger: explicit
---

# Skill Generator

This skill acts as a meta-agent to scaffold and register new capabilities within the NutriOrxata repo. It ensures that all new skills follow the structural and documentation standards of the project.

## Activation Triggers
- "Create a new skill"
- "Generate a skill for [topic]"
- "Nueva skill"
- "Quiero crear una skill..."

## Workflow

### 1. Requirement Gathering (Interactive)
If the user hasn't provided full details, the agent **MUST** ask for the missing information before generating files.

**Required Fields:**
1.  **Name:** (kebab-case, e.g., `frontend-architect`).
2.  **Description:** A concise summary for the `AGENTS.md` list.
3.  **Triggers:** specific phrases or contexts that activate the skill.
4.  **Workflow/Steps:** How should the agent think/act when using this skill?
5.  **Constraints:** Specific rules (e.g., "Never execute code", "Always use Spanish").

### 2. Generation Phase
Once requirements are clear:
1.  Create directory: `skills/<skill-name>/`.
2.  Generate file: `skills/<skill-name>/SKILL.md` using the **Standard Skill Template** (below).
3.  **Register (Global):** Add the new skill entry to the skills list in `docs/exec-plans/rules.md`.
4.  **Optional:** Add a short note in root `AGENTS.md` if the skill changes daily workflows.

## Standard Skill Template

The generated `SKILL.md` must follow this structure exactly:

```markdown
---
name: <skill-name>
description: <short-description>
trigger: <implicit|explicit>
---

# <Skill Title>

<Long description of the skill's purpose>

## Activation Triggers
- "<Trigger phrase 1>"
- "<Trigger phrase 2>"

## Workflow
1.  **Step 1:** ...
2.  **Step 2:** ...

## Rules & Constraints
*   ✅ **DO:** ...
*   ❌ **DON'T:** ...

## Templates / References
(Optional: Include templates for files this skill might generate)
```

## 3. Post-Generation Check
*   Confirm to the user that the skill is created and registered.
*   Show the updated list of skills in `docs/exec-plans/rules.md` (briefly).
