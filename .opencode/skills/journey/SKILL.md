---
name: journey
description: Show the project skill store, memory state, and recent work without changing anything. Run when asked what the agent has learned or what is in project memory.
---

# Journey

Read-only report. This skill never edits memory, archives a skill, or deletes a file.

## Report

1. List active skills and their usage state:

```bash
python .opencode/skills/curator/scripts/skills_report.py
```

2. List the memory files and sizes:

```bash
find .opencode/memory -maxdepth 3 -type f -print
wc -c .opencode/memory/MEMORY.md .opencode/memory/USER.md 2>/dev/null
```

On PowerShell:

```powershell
Get-ChildItem .opencode\memory -Recurse -File | Select-Object FullName,Length
```

3. Show the newest daily logs:

```bash
find .opencode/memory/domains -name '*.md' -type f | sort | tail -10
```

4. Paste the report. Summarize:

- Active skills and any stale learn-created candidates.
- Memory files over their character cap.
- The last few dated entries.
- Any open thread named in the newest daily log.

5. If the user asks to prune or correct, stop and route the request:

- Skill archive or consolidation: `curator`.
- Memory correction or new durable fact: `dev-memory`.
- New reusable procedure: `learn`.
- Small unsaved lessons from this session: `refine`.

## Rules

- A plain `/journey` does not mutate anything.
- A missing `USER.md` is not an error.
- An over-cap file is reported, not silently rewritten.
- A count without a date is not current. Re-check before repeating it.
