# Contributing to Piskel

Thanks for your interest in Piskel! This guide covers what kind of
contributions are accepted, how to set up a development environment, and
what a good change looks like. It applies to humans and coding agents
alike; agents should also read [AGENTS.md](AGENTS.md).

## What we accept

Piskel is maintained with limited time, so reviews are prioritized.

**Likely to be merged:**

- Small, straightforward fixes: documentation, typos, incorrect strings,
  minor bugs. A few lines.

**Unlikely to be reviewed or merged:**

- Large or complex bug fixes spread across many areas of the codebase.
- Major refactors that need significant testing, validation or
  architectural discussion.
- Changes to the user experience, and new features.

You're still welcome to open a PR, but for anything in the second group,
please [open an issue](https://github.com/piskelapp/piskel/issues) first to
discuss it. See [docs/vision.md](docs/vision.md) for what's in and out of
scope.

This policy is about unsolicited outside contributions. Refactoring work
done as part of a maintainer-approved plan in [docs/plans/](docs/plans/)
(such as the [modernization](docs/plans/modernization.md)) is expected and
follows that plan.

## Development setup

Requirements: Node.js 20 (the version used in CI) and npm.

```sh
git clone https://github.com/piskelapp/piskel.git
cd piskel
npm install                         # also installs the pre-commit hook
npx playwright install chromium     # browser for e2e tests
npm start                           # http://localhost:9001, live reload
```

All commands are listed in [AGENTS.md](AGENTS.md#commands). To understand
how the code is organized, read [docs/architecture.md](docs/architecture.md)
and the appendix of [docs/plans/modernization.md](docs/plans/modernization.md).

## Making a change

1. **Branch** from `master`.
2. **Find the relevant feature spec** in [docs/specs/](docs/specs/). It
   describes current behavior, points to the main code, and lists the e2e
   tests covering the feature.
3. **Make the change**, keeping it small and focused on one concern.
4. **Add or update an e2e test.** Bug fixes need a test that fails without
   the fix. See [docs/testing.md](docs/testing.md) and its rules about
   unit tests and mocking.
5. **Update the docs** if the change affects user-facing behavior (the
   feature spec), the architecture, or the developer workflow.
6. **Check locally:** `npm run lint`, then the relevant tests (at least the
   e2e specs for the area you touched; `npm test` for broad changes).
7. **Open a PR** against `master` and fill in the template.

## Code conventions

- **The codebase is being modernized** (ES modules, classes, TypeScript).
  Target conventions will be defined in
  [docs/plans/modernization.md](docs/plans/modernization.md) and take
  precedence over legacy patterns in the code. Until then, keep diffs
  minimal and don't restyle code you aren't changing. How the legacy code
  is wired (global namespace, script load order) is described in the plan's
  appendix.
- **Preserve the public contracts** listed in
  [architecture.md](docs/architecture.md#public-contracts) (`.piskel`
  compatibility, storage keys, embedding and test hooks, including
  `data-test-id` attributes).
- **Document changes go through the public piskel controller**, so they are
  undoable. New document-modifying actions must support replay.
- **Use the existing registries** for event names, user settings and
  keyboard shortcuts rather than ad-hoc string literals.
- **Formatting and lint** are handled by [biome](https://biomejs.dev)
  (`biome.jsonc`). Run `npm run lint:fix` instead of formatting by hand. The
  pre-commit hook runs `npm run lint` and blocks commits that fail it.
- **Don't edit `src/js/lib/`** (vendored libraries).
- **Dependencies** are pinned to exact versions. Avoid new runtime
  dependencies; discuss them in an issue first.
- **Browsers:** latest Chrome, Firefox and Edge. No IE11 workarounds, no
  mobile-specific code.

## Commits and PRs

- One logical change per commit, with a message that says what and why.
  Recent history uses short prefixes such as `fix:`, `test:`, `chore:`,
  `refactor:`, `build:`. Follow that style.
- PRs should explain the motivation, how the change was tested, and
  whether docs were updated (the PR template asks for all three).
- If you used a coding agent, you're responsible for the result: review the
  diff yourself and make sure the tests really ran.

## Reporting issues

Found a bug or want to request a feature? [Open an
issue](https://github.com/piskelapp/piskel/issues). Include the browser and
OS, steps to reproduce, and if possible a `.piskel` file that shows the
problem.

## License

By contributing, you agree that your contributions will be licensed under
the [Apache License 2.0](LICENSE).
