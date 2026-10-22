---
name: curator
description: Prune stale KeyOps project skills without losing them. Run when asked to tidy the skill store, or after a long run creates overlapping skills.
---

# Curator

Maintenance for the project skill store. The default is conservative: report first, archive only recoverable skills, never delete.

## Stores

```text
.opencode/skills/              active skills
.opencode/skills/.usage.json   usage metadata
.opencode/skills/.archive/     archived skills
```

A skill is hand-written unless `.usage.json` says `created_by` is `learn`. Hand-written skills are never archived by this workflow.

## Pass

1. Run the report:

```bash
python .opencode/skills/curator/scripts/skills_report.py
```

2. Read the report. A stale candidate is at least 30 days old, `created_by: learn`, and not marked `pinned`.
3. For each candidate, check its `SKILL.md` and confirm the procedure is covered elsewhere or is no longer true. If unsure, leave it active.
4. Archive with a dated directory move:

```bash
mkdir -p .opencode/skills/.archive
mv .opencode/skills/<name> .opencode/skills/.archive/<name>-YYYY-MM-DD
```

5. Set `state` to `archived` in `.usage.json`. Keep the entry so history is not lost.
6. If the user asked to consolidate in this turn, merge overlapping skills into one umbrella, fix references, then archive the absorbed directories and print the old-name to new-name map.
7. End with the report summary and either the archive list or `no changes`.

## Restore

Move the directory back to `.opencode/skills/<name>`, set `state` to `active`, and append a `restore` line to the ledger if one exists. Archive is a reversible move, not a delete.

## Rules

- Never delete a skill directory.
- Never archive `dev-memory`, `learn`, `refine`, `curator`, or a hand-written skill.
- Never archive a skill with a missing usage record.
- Merge only with explicit user permission in the current turn.
- Do not touch `.opencode/memory/`. That store follows `dev-memory`.
