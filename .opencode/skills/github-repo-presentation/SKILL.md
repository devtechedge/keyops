---
name: github-repo-presentation
description: Polish a public GitHub repository for a first visual review. Covers About, README, screenshots, topics, social preview, release, and root hygiene.
---

# GitHub repository presentation

The first screen should answer three questions in five seconds:

1. What is this?
2. Who is it for?
3. Why is it different?

## Audit first

Score the repo from 0 to 10 in each area:

- About: name, description, URL, topics.
- README: first visual, proof, quick start, claims.
- Screenshots: current, legible, real UI.
- Social preview: 1280x640, no clipped text.
- Release: tag, notes, install command.
- Root hygiene: license, security, contributing, CI, ignore rules.
- Links: every URL resolves.

Fix the highest score gap first. Do not rewrite a good README for style.

## About

The description cap is **340 Unicode code points**, not bytes. Copy shorter than the cap.

- Name: the product name.
- Description: what it does, for whom, and the differentiator. No slogan stack.
- Website: the live product or docs URL.
- Topics: 6 to 10 specific terms. Use lowercase, hyphenated tags. Include the language, the problem, and the main integrations.

Example shape:

```text
Rotate AI API keys across Vercel, GitHub Actions, and local env files, then verify and revoke the old key. Rollback included.
```

## README

- 900 to 1,400 words for a developer tool.
- First visual within the top 15 percent. Put the product screenshot after the title and one-sentence pitch.
- Include: one-line pitch, proof image, why it exists, quick start, how it works, supported matrix, security model, limitations, development commands, license.
- Show a real command and a real output. Do not invent a benchmark.
- Use relative image paths from the repository root.
- Use one sentence per paragraph in public copy. No em dashes.
- Do not name internal tracking files, private repositories, or personal paths.
- Do not use audience words such as `hiring manager`, `recruiter`, `portfolio piece`, `job-application project`, or `built for a job posting`.
- A claim that cannot be verified from the repo or a live URL does not belong in the README.

## Screenshots

Capture from the deployed site, not a local mock.

- Desktop: 1440px wide, dark and light if the product has both.
- Mobile: 390px wide, no horizontal overflow.
- Use a browser with a real viewport. A headless browser may clamp a narrow window to 500px; use Playwright or device emulation to verify 390px.
- Check `document.documentElement.scrollWidth === clientWidth` before saving.
- Show the primary action and the result, not an empty state.
- Store under `docs/screenshots/` with descriptive names.

## Social preview

- 1280x640 PNG.
- Product name, one-line pitch, and one visual proof point.
- Text at least 48px for the headline and 18px for the subhead.
- No text near the edges. No clipped terminal rows.
- Set it in GitHub repository settings and use the same image in the README or docs.

## Topics

Pick 6 to 10:

```text
ai, api-keys, secret-rotation, security, openai, anthropic, openrouter, vercel, github-actions, typescript
```

Do not add a topic that the repo does not implement.

## Release

- Tag the version that matches `package.json`.
- Write notes with: what changed, who should upgrade, breaking changes, and the install command.
- Attach the screenshot only when it changed.
- Verify the tag points at the intended commit.

## Root hygiene

- `LICENSE`
- `README.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `.github/workflows/ci.yml`
- `.gitignore` covers dependencies, build output, local env, escrow, and editor files.
- No generated build output, local secrets, or screenshots with customer data.
- No empty placeholder files.

## Final check

- Open the repo in a logged-out browser.
- Read the About, the first screen, and the install command.
- Click every link in the README.
- Check mobile rendering on GitHub.
- Confirm the CI badge is green or the failure is understood.
- Confirm the release tag and the default branch match.
