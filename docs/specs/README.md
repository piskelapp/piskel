# Feature specs

One file per feature area, describing how Piskel behaves **today**. Specs
are the reference for "what is the intended behavior?" when fixing a bug,
reviewing a change, or writing a test.

- A change that alters user-facing behavior updates the matching spec in
  the same commit.
- A spec describes behavior, not implementation. It doesn't point to
  code.
- If code and spec disagree, figure out which one is wrong. Don't silently
  "fix" either one: if unsure, ask.
- Every claim has an id, and tests reference the ids they verify (see
  [Claim ids](#claim-ids)).
- The e2e tests for `<spec>.md` live in
  `tests/e2e/playwright/integration/<spec>/`.

## Index

| Spec | Covers |
| --- | --- |
| [drawing-tools.md](drawing-tools.md) | Pen, mirror pen, bucket, magic bucket, eraser, stroke, rectangle, circle, move, lighten, dithering, color picker; pen size |
| [selection.md](selection.md) | Rectangle, lasso and shape selection; cut, copy, paste, delete, move |
| [transformations.md](transformations.md) | Flip, rotate, clone, center, crop |
| [canvas.md](canvas.md) | Drawing area: zoom, pan, mouse buttons, cursor coordinates, background, grid, tile mode |
| [frames.md](frames.md) | Frames list: add, duplicate, delete, reorder, hide; frame navigation |
| [layers.md](layers.md) | Layers list: add, rename, reorder, merge, delete, opacity, layer preview |
| [preview.md](preview.md) | Animated preview, FPS, preview sizes, popup preview, onion skin, minimap |
| [colors-and-palettes.md](colors-and-palettes.md) | Primary/secondary colors, color picker widget, palettes, current colors |
| [import.md](import.md) | Importing images, spritesheets, GIFs and `.piskel` files; drag and drop |
| [export.md](export.md) | GIF, PNG spritesheet, ZIP, C file, data URI, PixiJS; export scale |
| [save-and-storage.md](save-and-storage.md) | Save in browser, `.piskel` download, backups, unsaved changes |
| [settings.md](settings.md) | Preferences (misc, grid, tile), resize canvas, default size |
| [keyboard-shortcuts.md](keyboard-shortcuts.md) | Shortcut list, cheatsheet, remapping |
| [undo-redo.md](undo-redo.md) | History behavior |
| [editor.md](editor.md) | Startup and new sprite, dialogs, notifications, progress bar |

## Claim ids

Each claim in a spec, meaning each bullet or table row in "Behavior", starts
with an id in inline code:

```markdown
- `layers.rename` The edit button or double-click opens an inline input.

| Claim | Tool | Key | Behavior |
| --- | --- | --- | --- |
| `drawing-tools.pen` | Pen | `P` | Draws pixels along the mouse path. |
```

- An id is `<spec>.<name>`: the spec file name, a dot, then a short
  kebab-case name. Keep ids stable; rename one only together with the
  tests that reference it.
- A claim states a rule; several tests can exercise it. If a claim maps
  one-to-one onto a single test title, it is probably too fine: a tool and
  its modifiers are one claim. Split a rule out only when it needs to be
  reported on its own, typically because it is untested while the rest
  is.
- No scenario detail in specs ("hollow rectangle; `shift` makes a square",
  not "dragging from (1,1) to (5,3) gives ..."). Scenarios belong in tests,
  and tests don't restate the spec: the tag points to the claim.
- A Playwright test lists the claims it verifies as tags:
  `test('...', { tag: ['@layers.rename'] }, async ({ page }) => ...)`.
  Only tag a claim the test actually asserts. A test can reference claims
  from any spec.
- `npm run spec-check` fails on duplicate ids, ids that don't match their
  file, and tags referencing unknown ids. It lists the claims no test
  references: these are the test gaps, so specs don't list them by hand.
- Known gaps are recorded in [untested.txt](untested.txt), and that list
  may only shrink. `spec-check` fails on a new gap (a claim with no test
  that isn't listed) and on a listed claim that is now tested or no longer
  exists. When a new claim can't be tested yet, add its id to the list in
  the same change, so the gap is visible in review.
  `npm run spec-check -- --update-baseline` rewrites the list.
- `npx playwright test --grep @layers.rename` runs the tests for a claim.
  `--grep` is a regular expression, so this also matches ids that start
  with the same text, such as `layers.rename-cancel`.

## Template

Copy this for a new spec. Keep sections that don't apply, with "None".

```markdown
# <Feature area>

## Purpose
One or two sentences: what this lets the user do, and why.

## Behavior
What the user can do and what happens. One claim per bullet, each
starting with its id, grouped by sub-feature. Include defaults, limits,
modifier keys and edge cases (empty sprite, single frame, max size,
transparent pixels, ...).

- `<spec>.<name>` A single, testable statement.

## UI and shortcuts
Where the feature lives in the UI, and its default shortcuts.
```

## Conventions

- Specs cover the editor as users see it. Build tooling, embedding
  hooks, storage keys and file-format compatibility are described in
  the architecture docs instead.
- Known bugs and oddities go in [known-issues.md](../known-issues.md),
  not in specs.
- The NW.js desktop app is not specified: it is planned for removal.
  Desktop-only code paths (filesystem save/open, `ctrl+O`,
  `ctrl+shift+S`) have no spec and no tests.
- `ctrl` means Ctrl on Windows/Linux and Cmd on macOS.
- Mark anything uncertain with _(to confirm)_ rather than guessing.
