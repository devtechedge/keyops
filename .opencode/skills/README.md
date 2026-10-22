# Project skills

These are repository-scoped workflows for agents working on KeyOps. They are plain Markdown with YAML frontmatter and no runtime dependency.

| Skill | Use it when |
| --- | --- |
| `dev-memory` | Start or end a work session, or save a durable decision. |
| `curator` | Tidy the skill store or review stale learned skills. |
| `journey` | Report what is in the skill store and project memory. |
| `learn` | Turn a finished workflow into a reusable skill. |
| `refine` | Review a session for corrections and unsaved lessons. |
| `oss` | Work on an upstream open-source issue or pull request. |
| `github-repo-presentation` | Polish a public repository for a first visual review. |

## Format

```markdown
---
name: skill-name
description: One line describing when to load it.
---
```

The `name` must match the directory. Keep procedures in `SKILL.md`; put long references in `references/`.

## State

- `.usage.json` tracks skill usage and provenance.
- `.archive/` holds recoverable archived skills.
- `.opencode/memory/` holds project memory, not skill procedures.

None of these files may contain API keys, admin tokens, customer data, or unredacted environment values.
