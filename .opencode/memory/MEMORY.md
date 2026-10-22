# KeyOps project memory

Last reviewed: 2026-10-22

## Product

- KeyOps rotates AI API keys across consumers, verifies the replacement, then revokes the old key.
- The differentiator is the rotation transaction and rollback, not another scanner or spend dashboard.
- Repo: `devtechedge/keyops`
- Live site: `https://keyops-teal.vercel.app`
- Vercel project: `keyops`, root directory `web`
- Release state, deploy commands, and open release threads: `.opencode/memory/domains/release/MEMORY.md`

## Stack

- CLI: TypeScript, tsup, commander, vitest.
- Web: Next.js 16, React 19, Tailwind 4, Geist.
- Node 20 or newer. Local Node 24.
- CLI tests: 20 across 5 files.

## Commands

```bash
npm install
npm run typecheck
npm test
npm run build
npm run web:build
npm run ci
```

## Decisions

- Rotation is on demand. Do not promise weekly automatic rotation as a default.
- Anthropic key creation is assisted because its API does not create keys.
- Vercel and GitHub secret values are write-only, so the old key must be supplied for escrow.
- The web dashboard is a demo with mock data. The CLI and rotation engine are real.
- No raw keys are stored by the hosted site. Browser audit is local and masked.
- Hosted run history, auth, billing, and a custom domain are not built yet.

## Hard rules

- Never commit a real key, admin token, escrow value, or `.env` file.
- Never add em dashes to public copy.
- Read the source or run the command before repeating a current count or behavior claim.
- Keep public text precise and free of internal tracking paths.
- Use `npm run ci` before pushing a code change.
