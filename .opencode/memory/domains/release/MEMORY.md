# Release state

Last reviewed: 2026-10-22

- Current release: `v0.1.0`, published at
  `https://github.com/devtechedge/keyops/releases/tag/v0.1.0`.
- Live alias: `https://keyops-teal.vercel.app`. The clean `keyops.vercel.app` name belongs to an
  unrelated app, so it is not this project.
- Vercel project: `keyops` in team `devtechedge1`. Deploy from `web/`:
  `vercel deploy --prod --yes`.
- If the project is ever connected to GitHub, set the Vercel root directory to `web`.
- CI is green on `main`. `npm run ci` covers typecheck, 20 tests, CLI build, and web build.
- `npm audit` reports 0 vulnerabilities.
- npm publish is blocked: the local npm CLI has no auth. `npx github:devtechedge/keyops#main`
  works from the `prepare` build.
- Social preview is uploaded and hash-verified against `web/public/og.png` at 1280x640.
- README is 1,298 words, About is 339 code points, and 10 topics are set.
