---
name: piskel-review
description: Review a Piskel branch or pull request — correctness, spec claims and their e2e coverage, unclear specs, known issues, tests, commit messages and the PR description. Use whenever asked to review a branch, a diff, a PR or "the current changes" in this repo, or to check that a PR is ready, even if the request only says "review".
---

# Reviewing a Piskel change

A review here checks more than the code: Piskel's specs are the reference for
intended behavior, and every claim must be covered by an e2e test. Review the
change against all of the steps below, then report. Propose fixes; apply them
only when the user asks.

## 0. Gather the change

- Branch: `git log --oneline master..HEAD` and `git diff master...HEAD`.
- PR: `gh pr view <n>` and `gh pr diff <n>`, plus the commits.
- Read every commit message and the PR description: they are reviewed too.
- Read the specs touched by the change, and the specs of the feature areas the
  code touches even when no spec changed ([docs/specs/README.md](../../../docs/specs/README.md)
  maps areas to files).

## 1. Correctness

- Look for bugs the change introduces, and for bugs it leaves in the code it
  touches.
- **Verify each finding before reporting it.** Read the callee, follow the
  data, and check that the failure can happen through the UI. Drop findings
  that can't: for example, a write that only ever goes to `colors[-1]` changes
  neither the list nor the saved JSON.
- Reproduce UI findings: a throwaway Playwright test in the right
  `integration/<spec>/` folder (delete it afterwards), or the Firefox MCP tools.
  Say how each finding was confirmed.
- Label each finding: introduced by the change, or pre-existing.

## 2. Specs

- A change to user-facing behavior updates the matching spec, in the same
  commit. Follow the rules in [docs/specs/README.md](../../../docs/specs/README.md):
  behavior not implementation, one claim per bullet, ids `<spec>.<name>`, no
  scenario detail.
- Claims live under "Behavior". "UI and shortcuts" is a pointer without ids:
  anything that must be tested there (such as a panel's position) has to become
  a claim.
- **Unclear or ambiguous specs: propose a clarification**, with the new wording.
  Watch for:
  - one word used for two things (the palette dialog once said "selected" for
    both the swatch and the color picker's color);
  - two names for one thing (a button's label vs its tooltip);
  - parts of the UI the claims rely on but never describe (layout, which item
    is selected on open, what a widget shows when its list is empty).

  Name the parts in a short paragraph at the top of the section, then reuse
  those names in every claim.
- If code and spec disagree, ask which one is wrong; don't decide alone.

## 3. Claim coverage

Every claim the change adds or touches must be covered by an e2e test.

- `npm run spec-check` only checks tags. **Check that the tagged tests assert
  every sentence of the claim.** List each part that no assertion checks.
- `docs/specs/untested.txt` may only shrink. A new claim gets a test, or its id
  is added there in the same change.
- Appearance and layout (positions, icons, order of panels or buttons) are
  covered by tagging a visual test whose screenshot shows them. Don't assert
  bounding boxes or DOM order in integration tests for that.
- Prefer extending an existing test of the same claim or scenario over adding
  a new one. Merge tests when they share setup and check related parts of one
  feature; don't build tests that check unrelated things.
- For a bug fix, check that the new or changed tests fail without it: put
  back `master`'s version of the fixed file (`git show master:<file> > <file>`),
  run the tests, then restore the file and check `git diff`.
- For limits, "does nothing" and selection rules, ask for mutation checks:
  break each behavior of the fix on its own and confirm a test fails. When a
  mutation can't be seen through the UI, the report says why.
- Test style follows the `e2e-tests` skill: `data-test-id`, no `window.pskl`
  internals, ASCII grids for pixels, a comment per user step. Load that skill
  before reviewing test code in depth, and always before proposing or writing
  test changes.

## 4. Unit tests

- Prefer e2e tests. A unit test is for logic that the UI can't reach or
  can't isolate.
- **No mocks** (`vi.fn()`, `vi.spyOn(...).mockImplementation`, `mock<T>()`).
  A mock drifts from the real object: a mocked color picker whose `setColor`
  never called back hid a write to the palette. Use real instances, or small
  stub classes that implement the real interface.
- When a stub can't be passed in, propose a `forTesting` API in `src` (a
  static factory or an optional constructor argument, named `...ForTesting`)
  rather than building objects with `Object.create` and patching fields.

## 5. Known issues

[docs/known-issues.md](../../../docs/known-issues.md) lists known bugs; specs
describe the intended behavior.

- A bug found during review that the change doesn't fix: propose a new entry,
  in the section of its feature area. Say what the user sees, the code
  responsible, and a short repro.
- **Entries the change fixes are removed.** For every bug fix, search
  `known-issues.md` for the behavior and the code it names (function names,
  file names), and check each entry of the feature area against the new code.
  If the fix makes an entry untrue, even partly, the entry is removed (or
  reworded to what remains) in the same commit as the fix, and the commit
  message says so. A fix that leaves its known issue in place is a finding.
- An entry that is no longer true for another reason: propose removing it.

## 6. Commits

- Each commit message describes what that commit actually contains. After
  fixups, re-read the messages: a folded-in change often makes one out of date.
- Changes that belong to an existing commit of the branch are folded into it
  (`git commit --fixup` and an autosquash rebase); unrelated work goes in its
  own commit, or its own PR when it isn't about the PR's topic.
- `git commit --fixup --no-verify` and rebases don't run the pre-commit hook.
  After folding changes in, run `npm run lint`, `npm run unit-tests` and
  `npm run spec-check` by hand before saying the branch is ready.
- Never commit, amend, rebase or push on your own: propose, and do it only
  when the user asks for that action.

## 7. PR description

- It matches the commits as they are now: problem, fix, spec changes, tests,
  and new or removed known issues.
- Test claims are real: commands run, counts, and which tests fail without the
  fix. Remove any that are no longer true (such as removed tests).
- **Sentry:** when the PR fixes an issue reported in Sentry, the description
  ends with a last line of the form `Sentry: JAVASCRIPT-HT`. If the bug looks
  like a production crash and no Sentry id is known, ask for it.

## Running checks

- `npm run lint`, `npm run unit-tests`, `npm run spec-check`.
- E2E: `npx playwright test <path> --retries=0 --repeat-each=5`. The config
  retries 3 times, which hides flakiness.
- Run `npx playwright` as a command on its own: no pipes through `grep`,
  `sed`, `sort` or `cut`, which prompt for permission every time. Use
  `--reporter=line` or `--reporter=dot`, or filter inside a scratchpad script.
- Before breaking the app for a mutation check, make sure nothing is serving
  on port 9001 (Playwright reuses it). Restore `src/` after each mutation and
  check `git diff`.
- Visual baselines only match in the CI container (fonts differ elsewhere): a
  local `npm run visual` failure is not a finding. Use `npm run visual:local`,
  or rely on the `visual` CI job.

## Report

Group the findings, most important first, each with `file:line` and a
concrete fix:

1. **Bugs**: introduced by the change, then pre-existing ones worth fixing here.
2. **Spec clarifications**: the current wording and the proposed one.
3. **Coverage gaps**: each claim part without an assertion, and which existing
   test to extend.
4. **Known issues**: entries to add, remove or update.
5. **Tests**: mocks, duplicated or unrelated tests, style.
6. **Commits and PR description**: out-of-date messages, missing Sentry line.

End with a recommendation of what to do in this PR and what to leave for
later, and ask before applying anything.
