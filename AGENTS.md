# AGENTS.md

## Mandatory YSU AI Core preflight

This is a YSU project. Before meaningful work in every new agent session, new meaningful task, and agent handoff:

1. Load the **current canonical** YSU AI Core at https://github.com/blackeirose/ysu-ai-core (`blackeirose/ysu-ai-core`). Read its current `AGENTS.md`, `AI_CORE.md`, and task-relevant shared references required by the Core.
2. Then read this project's `AGENTS.md`, `PROJECT_CONTEXT.md`, and `DECISIONS.md` where present; inspect the current branch, working tree, and implementation before changing anything.

Do not substitute an old local/cached Core copy or previous chat memory for current canonical access. If the Core is inaccessible, surface the limitation and pause meaningful work. A trivial, non-meaningful edit does not authorize architecture, service, data, authentication, deployment, or other durable changes.

Local rules may add stricter requirements but must not silently weaken the Core. Surface conflicts rather than silently overriding either the Core or a confirmed user decision. Preserve all project privacy, security, no-deploy, and release-approval holds. This entry does not grant permission to deploy or change production.

**YSU Project Agent Entry Template**
**Template Version:** 1.0

This file is the AI-agent entry point for an individual YSU project.

It is intentionally short. Project-specific durable knowledge belongs in `PROJECT_CONTEXT.md` and `DECISIONS.md`, while global development principles remain in the canonical YSU AI Core.

---

# 1. GLOBAL CORE

This repository is a YSU project and must follow the canonical YSU AI Core.

Canonical source:

`https://github.com/blackeirose/ysu-ai-core`

Before meaningful work, use the available GitHub / workspace access to read the current canonical Core, beginning with its `AGENTS.md` and `AI_CORE.md`, then load additional shared references only when relevant.

Do not create a separate agent-specific interpretation of the Core.

Do not copy or rewrite the Global Core into this project unless there is a specific operational reason to maintain a local snapshot.

If the canonical Core is inaccessible, pause meaningful work and surface the limitation. Only trivial, non-meaningful edits may proceed with sufficient local context; this is not an exception for meaningful development or durable changes.

---

# 2. PROJECT START SEQUENCE

When entering this project:

1. Load the current YSU AI Core.
2. Read `PROJECT_CONTEXT.md`.
3. Read `DECISIONS.md`.
4. Inspect the current repository and working implementation.
5. Read additional project documentation only when relevant.
6. Confirm the task against the existing project state.
7. Then begin work.

Do not rely on previous ChatGPT, Codex, Gemini, or other agent conversation history as the project truth.

---

# 3. AUTHORITY ORDER

If instructions conflict, follow this priority:

1. Current explicit user instruction
2. Active / LOCKED decisions in `DECISIONS.md`
3. `PROJECT_CONTEXT.md`
4. Canonical YSU AI Core
5. Relevant shared reference documentation
6. Agent recommendation or assumption

Do not silently override a higher-priority decision.

---

# 4. EXISTING PROJECT BEHAVIOR

Before significant implementation work:

- understand what already works
- identify the current architecture
- inspect relevant source code
- check recorded project decisions
- preserve established functionality
- make the smallest appropriate change

Do not rebuild, migrate, or restructure a working project simply because another implementation appears cleaner or newer.

---

# 5. PROJECT KNOWLEDGE

Use the project files by purpose:

`PROJECT_CONTEXT.md`

→ What the project is now: purpose, architecture, services, deployment, storage, integrations, constraints, and current direction.

`DECISIONS.md`

→ Why durable project-specific choices were made and when they may be reconsidered.

Current task / issue / development session

→ Temporary implementation details.

Do not put temporary task details into permanent project documentation.

---

# 6. DURABLE CHANGES

When a confirmed change materially affects the project:

- update `PROJECT_CONTEXT.md` if the current durable state changed
- update `DECISIONS.md` if a meaningful project decision was confirmed
- do not promote a project-specific choice into the Global Core automatically

Global promotion should occur only when a pattern proves reusable across projects.

---

# 7. MULTI-AGENT COMPATIBILITY

This project may be worked on by:

- ChatGPT
- Codex
- Gemini / Antigravity
- future AI agents
- human developers

All contributors must work from the same canonical repository state.

Do not maintain separate ChatGPT, Codex, or Gemini versions of the project.

Instructions in this file must remain platform-neutral whenever practical.

---

# 8. BEFORE FINISHING

For meaningful implementation work, verify that:

1. the requested behavior works
2. relevant existing behavior remains intact
3. the repository reflects the intended implementation
4. project documentation still matches the current state
5. newly confirmed durable decisions are recorded when required
6. the next agent can continue without the previous private conversation history

---

# 9. DEFAULT MINDSET

**Load the shared Core.**

**Understand the project.**

**Preserve confirmed decisions.**

**Solve the actual requirement.**

**Use the simplest sufficient architecture.**

**Leave the repository ready for the next agent.**

## Writing UI maintenance
For MAIN UI work, apply current canonical ysu-ai-core/docs/SMALL_PROJECT_UI_STANDARD.md and preserve DESIGN.md tokens. Writing publishing requires explicit owner instruction; see docs/WRITING.md. Never deploy dist-qa or fixture content. Preserve the existing Product Registry security boundary and independent Writing presentation model.
