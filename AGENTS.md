# AGENTS.md

Quick reference for coding agents working in this repository. It is loaded
into every agent session, so it only holds what you must not get wrong.
Everything else is in [docs/](docs/README.md):

- [docs/architecture.md](docs/architecture.md): how the code is organized.
- [docs/testing.md](docs/testing.md): how to write and run tests.
- [docs/specs/](docs/specs/README.md): how each feature behaves. The e2e
  tests for `docs/specs/<spec>.md` are in `tests/e2e/playwright/integration/<spec>/`.
- [CONTRIBUTING.md](CONTRIBUTING.md): conventions and contribution process.

## Project

Piskel is a browser-based sprite and pixel-art editor (piskelapp.com).
JavaScript, HTML and CSS, no framework, no backend.

## Commands

| Task | Command |
| --- | --- |
| Build to `dest/prod` | `npm run build` |
| Dev server with live reload (port 9001) | `npm start` |
| Lint / format check (`src/` only) | `npm run lint` |
| Auto-fix lint + formatting | `npm run lint:fix` |
| E2E tests (Playwright) | `npm run e2e` |
| Single E2E spec | `npx playwright test <path-to-spec>` |
| Unit tests (Karma + Jasmine, headless Chrome) | `npm run unit-tests` |
| Everything | `npm test` |

- The pre-commit hook runs `npm run lint`; commits fail on lint errors.
- `npm run e2e` reuses a server already running on port 9001. After
  changing `src/`, stop any stale server or the tests run old code.
- Playwright retries failing tests 3 times. A test that only passes on
  retry is flaky, not passing.

## Codebase in transition

The codebase is about to be modernized (ES modules, classes, TypeScript),
mostly by agents. The plan lives in
[docs/plans/modernization.md](docs/plans/modernization.md); it is a
partial draft: the verification harness is written, the goal and target
conventions are not yet.

- **Legacy patterns in the code are not conventions to copy.** Once the
  plan defines target conventions, they take precedence over whatever the
  surrounding code does.
- **Until the plan is written, don't start migration work** unless a
  maintainer explicitly asks for it. For other changes, keep the diff
  minimal and don't restyle code you aren't changing.
- **How the legacy code works** (global `pskl` namespace, script load
  order, build) is described in the plan's appendix. Read it before adding
  or moving files.

## Invariants (hold before, during and after the migration)

- **Don't break the public contracts** listed in
  [docs/architecture.md](docs/architecture.md#public-contracts): `.piskel`
  compatibility, browser storage keys, embedding hooks, test hooks
  (`data-test-id`, the `window.pskl` entry points used by e2e helpers).
- **Document changes go through the public piskel controller**, so they are
  recorded in history and the UI redraws. Every document-modifying action
  must be replayable for undo.
- **Never edit `src/js/lib/`** (vendored).

## Tests

**Default to Playwright e2e tests.** New behavior and bug fixes get a test
that drives the real editor. **Do not write unit tests that mock
collaborators** (controllers, services, pubsub, the DOM): they restate the
implementation and catch nothing. Unit tests are only for pure logic, and
only when an e2e test is impractical. Go through the helpers in
`tests/e2e/playwright/testutils.ts` rather than calling `window.pskl`
directly from specs. Details in [docs/testing.md](docs/testing.md).

## Working agreements

- Keep changes small and focused; one concern per commit.
- Before changing a feature, read its spec in `docs/specs/`. If the code
  and the spec disagree, say so instead of picking one silently.
- If a change alters user-facing behavior, the architecture, or a
  developer workflow (commands, build, tests), update the matching doc or
  spec in the same commit. If none exists yet, mention that in your summary
  rather than silently skipping it.
- In docs, point to code instead of copying it: reference the file that
  holds a fact rather than duplicating its contents, and avoid line
  numbers, counts and version numbers.
- Run `npm run lint` and the relevant tests before calling work done. If
  you could not run something (e.g. headless Chrome unavailable), say so
  explicitly rather than implying it passed.
- Don't commit or push unless asked.
