# Security

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| Older | No |

## Reporting a vulnerability

Email **devtechedge@gmail.com** with the subject `KeyOps security report`.

Please include:

- What is affected: CLI, web app, escrow, provider adapter, or consumer adapter.
- The version or commit.
- Steps to reproduce without including a real credential.
- The impact you believe it has.
- Any suggested fix or mitigation.

Do not open a public issue for a vulnerability. Do not send live API keys, admin tokens, or production config. Use fake values assembled at runtime if you need to demonstrate a parsing or rotation issue.

I will acknowledge a report within 48 hours and aim to have a fix or mitigation within 7 days for a confirmed issue. I will credit the reporter if they want credit.

## Scope

In scope:

- The KeyOps CLI and its rotation transaction.
- Local escrow, run records, and keyring access.
- The Next.js web app, including the browser audit.
- Provider and consumer adapters in this repository.

Out of scope:

- The security of OpenAI, Anthropic, OpenRouter, Vercel, GitHub, or another third-party service.
- A leaked key that was already exposed before KeyOps rotated it.
- Reports that require a compromised local machine, a malicious OS keyring, or a modified build.
- Denial of service against a provider API.

## Key handling

- The browser audit runs locally and masks values before render.
- The CLI reads admin tokens from the operating system keyring or environment variables.
- Escrow is encrypted with AES-256-GCM under `~/.keyops/escrow`.
- The escrow key lives in `~/.keyops/escrow.key` or `KEYOPS_ESCROW_KEY`.
- Vercel and GitHub secret values are write-only, so the old key must be supplied for rollback escrow.

If you believe escrow or a run record is exposed, rotate the affected provider key first, then remove the local `~/.keyops` directory and report the issue.
