---
name: oss
description: Work on upstream open-source issues and pull requests from the KeyOps project. Covers target screening, reproduction, serial shipping, maintainer voice, comment approval, and post-run review.
---

# OSS contribution workflow

Use this for upstream repositories other than KeyOps. KeyOps itself is owned work: commit to `main` directly, do not open a pull request against it.

## 0. Operating rules

- One well-run PR at a time. A second needs explicit permission.
- Quality over quantity. Prefer a small, reproducible fix with a test over a large cleanup.
- Read the repository's `CONTRIBUTING.md`, `AGENTS.md`, `AI_POLICY.md`, and `.github/workflows/` before claiming an issue.
- Never post as another account. Never ask for a post without showing the exact text first.
- No em dashes in maintainer-facing text. Use a hyphen or split the sentence.
- AI disclosure is mandatory-only. Disclose exactly what a policy or template asks for.
- Never put a private repository name, an internal tracking path, or a personal note in a public PR.

## 1. Screen the target

A target is GO only when all of these hold:

- The issue is open, has no owning assignee, and has no competing open fix PR.
- The issue timeline has no maintainer-linked in-house PR.
- The repository has pushed within about three months and merged an outside PR in the last 30 days.
- The issue is fresh, usually six weeks or less.
- The fix belongs to that repository, not a companion package that is already fixed.
- The bug reproduces on the current default branch. Reproduce before implementing.
- The patch is bounded, usually under 150 lines, with a test when the repo has tests.
- The repository accepts outside PRs. Check contribution policy, CLA, required labels, and signed-commit rules.
- No account-level scanner or auto-close workflow will close the PR at open. Check `.github/workflows/` for `pull_request_target` close bots, AgentScan, and similar gates.
- The issue is not already covered by our open PR, a closed-unmerged attempt, or an older canonical thread.

If a target fails a hard gate, record why and move on. Do not argue with a bot.

## 2. Write the brief

Before code, write a short brief:

- Issue link and expected behavior.
- Reproduction command and observed result.
- Root-cause hypothesis and the files involved.
- Gates checked with evidence.
- Test plan.
- Any competing PR or overlap.

A brief is a lead, not a specification. Re-verify the cause and the version before editing.

## 3. Implement

1. Fork and branch from the branch the repo uses for contributions.
2. Reproduce the failure on the unmodified code.
3. Add a focused regression that fails before the fix and passes after.
4. Run the repository's full unit suite, formatting, and lint on the toolchain CI uses.
5. Keep commits focused. Every commit should pass tests on its own.
6. Add a changeset when the repository uses one. Do not amend or force-push just to add the PR link to a changeset.
7. Sign commits or add `Signed-off-by` when the repository requires it. Verify the signature through the API.
8. Fix actionable review findings in your own diff. Leave pre-existing behavior outside the issue alone.

For KeyOps changes, use `npm run ci` before pushing. For a docs-only change in another repo, run the repo's docs build if it exists.

## 4. Open the PR

- Use a title that names the fix, not the issue number alone.
- Lead with what changed and why.
- Include the reproduction and the test result.
- Use `Fixes #N` only when the change fully resolves the issue. Use `Part of #N` or `Partially addresses #N` otherwise.
- One sentence per paragraph. Blank line between paragraphs.
- No walls of text. A maintainer should understand the change in under a minute.
- Wait for green CI or confirm every red check is non-actionable before reporting done.

## 5. Comment approval gate

Before posting any issue reply, PR comment, or review:

1. Show the full text to the user as a fenced code block.
2. Wait for explicit approval of that exact text.
3. Post the approved text verbatim.
4. Fetch it back and compare. A 201 does not prove the content is correct.

A general "go ahead" authorizes the work, not the wording. A relayed approval that predates the draft is not approval of the draft.

## 6. Maintainer responses

- Read the current thread and the author association before acting. A reporter agreeing is not maintainer sign-off.
- Bots are not people. A bot approval does not unlock a human review gate.
- If the issue is marked duplicate, move the proposal to the canonical thread and leave one short courtesy link.
- Do not set up a watch, cron, or poll loop. Respond when the user relays activity.
- Silence is not consent. Prefer one polite nudge over closing a green PR.
- If the repository closes the PR automatically, mark it closed, do not refile, and do not reply to the bot.

## 7. Post-run review

Before retiring the session:

1. Re-read the commands and outputs.
2. Extract what generalizes to a future repo.
3. Put general rules in this skill. Put repo-specific facts in the issue or a private tracker, never in the public skill.
4. Run the relevant verification one last time.
5. Report the PR URL and the final state.
