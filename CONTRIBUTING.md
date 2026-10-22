# Contributing

Thanks for taking a look at KeyOps. The project is small on purpose: key rotation should be understandable, testable, and easy to audit.

## Before you start

- Open an issue for a large change before writing code. A short design note saves a long review.
- For a bug, include the command, the manifest shape with secrets removed, the expected result, and the actual result.
- Never paste a real API key into an issue, pull request, test, or screenshot. Use a clearly fake key that is assembled at runtime when a test needs one.

## Development setup

```bash
git clone https://github.com/devtechedge/keyops.git
cd keyops
npm ci
npm run build
npm test
```

The web app is a workspace:

```bash
npm run web:dev
npm run web:build
```

## Checks

Run the same checks as CI before opening a pull request:

```bash
npm run ci
```

This runs the CLI typecheck, the test suite, the CLI build, and the Next.js production build.

## Pull requests

- Keep the change focused. Split unrelated refactors into separate pull requests.
- Add or update tests when behavior changes.
- Update the README when a command, flag, provider capability, or manifest field changes.
- Do not commit generated output such as `dist/`, `.next/`, coverage, local escrow, or `.env` files.
- Describe the risk and the rollback path for changes that touch rotation, escrow, verification, or provider writes.

## Commit style

Use a short imperative subject with a scope when it helps:

```text
feat(cli): add OpenRouter provisioning
fix(core): restore consumer values after a failed verify
docs: document Anthropic assisted rotation
test(core): cover dotenv quote preservation
```

## Security

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the MIT License.
