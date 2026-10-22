---
name: dev-memory
description: Project memory for KeyOps. Load at the start of a work session and update at the end so decisions, commands, and open threads survive across chats.
---

# Project memory

KeyOps keeps project memory in the repository so an agent can pick up work without a long handoff. The memory files hold decisions and state. This skill holds the protocol.

## Layout

```text
.opencode/memory/
  MEMORY.md                    project facts, commands, hard rules
  USER.md                      collaborator preferences, optional
  domains/<name>/MEMORY.md     per-area standing facts
  domains/<name>/YYYY-MM-DD.md daily work log
```

Use a domain for a body of work that has its own vocabulary, for example `cli`, `web`, `oss`, or `release`. Keep the global file for rules that apply everywhere.

## Session start

1. Read `.opencode/memory/MEMORY.md`.
2. Read `.opencode/memory/USER.md` if it exists.
3. Read the `MEMORY.md` for each domain that matches the task.
4. Read today's daily log for those domains if it exists.
5. Treat memory as a lead, not proof. Re-run a command or read the source before repeating a claim about current behavior.

Do not load every old daily log. They are history. Load the one you need.

## During the session

- When the user says `remember this`, `note this`, or `save this`, write it to the right file in that turn and confirm in one line where it went.
- Put durable decisions, rules, environment facts, and current counts in a standing `MEMORY.md`.
- Put progress, attempts, failures, and dated numbers in the daily log.
- Keep one rule in one place. Link to a skill instead of copying a procedure into memory.
- Write a short checkpoint after a long run if the session has no save yet.
- Never store API keys, admin tokens, escrow contents, personal data, or unredacted `.env` values.

## Session end

A save is due on `save memory`, `checkpoint`, `wrap up`, `session ended`, a goodbye, or a clear topic close.

1. Append to `.opencode/memory/domains/<name>/YYYY-MM-DD.md`. Include what changed, what was decided, and what is open. Prefer concrete numbers and file paths over narrative.
2. Promote durable items to the domain `MEMORY.md` or the global `MEMORY.md`.
3. Correct a wrong standing fact in place. Do not leave two contradicting bullets.
4. Keep caps: global `MEMORY.md` 6,000 characters, `USER.md` 2,500, each domain `MEMORY.md` 8,000. Compact before exceeding a cap.
5. Confirm in one line what was saved and where.

If the session produced a reusable procedure, use the `learn` skill. If it produced small corrections, use `refine`.

## Hard rules

- This is a public repository. Memory must be safe to publish.
- No secrets, no customer data, no private infrastructure details.
- No em dashes in public-facing memory or docs.
- A count without a date is not a fact. Re-check it.
- A deleted file is not deleted memory. Move the substance to a dated log first.
