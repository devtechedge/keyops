# KeyOps agent instructions

## Start here

1. Read `README.md` for the product and install path.
2. Read `.opencode/memory/MEMORY.md` for current decisions.
3. Read the relevant `.opencode/skills/*/SKILL.md` when the task matches one.
4. Run the command before repeating a claim about behavior, counts, or deployment.

## Commands

```bash
npm install
npm run typecheck
npm test
npm run build
npm run web:build
npm run ci
```

The web app lives in `web/`. The CLI entry point is `src/cli.ts`.

## Rules

- Never commit a real API key, admin token, escrow value, or `.env` file.
- Never add em dashes to public copy.
- Keep the README and web copy honest about assisted and manual provider flows.
- Keep commits focused. Do not commit `dist/`, `.next/`, coverage, or local memory logs.
- Update tests and docs when behavior, flags, or provider support changes.
- Use `.opencode/skills/github-repo-presentation` before changing public repo metadata.

## Project skills

- `dev-memory`: save and load project context.
- `curator`: tidy the skill store.
- `journey`: report skills and memory.
- `learn`: capture a procedure as a skill.
- `refine`: review a session for durable lessons.
- `oss`: upstream contribution workflow.
- `github-repo-presentation`: public repo presentation checklist.
