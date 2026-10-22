# KeyOps, and where it went

This repository was a parallel build of the same product brief. The canonical repository is
**[devtechedge/keyward](https://github.com/devtechedge/keyward)**, and the hosted control plane is
**https://keyward-seven.vercel.app**.

Three public repositories for one product is a problem, not a feature. A visitor who finds more than
one cannot tell which is real, and the work splits in three.

## What was kept, and where it went

| From KeyOps | Now in keyward |
| --- | --- |
| Encrypted escrow for the value being replaced | `packages/core/src/escrow.ts` |
| Per provider capability matrix (inventory, create, delete, verify) | `packages/core/src/capabilities.ts` |
| Consumer adapter interface (dotenv, Vercel, GitHub) | `packages/core/src/consumers/` |
| Security policy | `SECURITY.md` |
| Scheduled rotation job and approval flow | `keyward due` plus the rotation engine |

## What was deliberately dropped

- **The `KEYOPS_HOME` directory and its own keyring.** keyward uses `KEYWARD_HOME`, and the escrow
  key comes from the environment rather than a file.
- **The provider capability table as a separate module.** The same idea is in
  `packages/core/src/capabilities.ts`, smaller, and it says plainly that Anthropic key creation is
  assisted rather than automated, because that is the truth.
- **The Tailwind and Geist styling.** keyward uses one hand written CSS file, so the page ships
  kilobytes of CSS instead of a framework runtime.
- **A separate mock database.** keyward uses Neon Postgres, with a demo dataset when no account is
  connected.

## The one product decision worth keeping from all three builds

The brief asked for a tool that finds every AI key, rotates it, and pings on odd spend, at $99 a
month. The market research turned up the reason that is hard: discovery is free and spend
dashboards are cheap, so the defensible part is **fan-out rotation with read-back verification and
rollback**. One logical secret lives in Vercel, GitHub Actions, Supabase, a local `.env` and CI.
Rotating it means creating the replacement, writing it to every consumer in the right order,
proving each one now holds the new value, and only then revoking. Every tool in that space ships
"no rollback" or "manual-assist".
