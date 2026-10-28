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
- The e2e tests for `<spec>.md` live in
  `tests/e2e/playwright/integration/<spec>/`. Specs don't list their
  tests; they list what is **not** tested, under "Test gaps".

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
| [import.md](import.md) | Importing images, spritesheets, GIFs and `.piskel` files; drag and drop; paste |
| [export.md](export.md) | GIF, PNG spritesheet, ZIP, C file, data URI, PixiJS; export scale |
| [save-and-storage.md](save-and-storage.md) | Save in browser, `.piskel` download, desktop save, backups, unsaved changes |
| [settings.md](settings.md) | Preferences (misc, grid, tile), resize canvas, default size |
| [keyboard-shortcuts.md](keyboard-shortcuts.md) | Shortcut list, cheatsheet, remapping |
| [undo-redo.md](undo-redo.md) | History behavior |
| [desktop-and-cli.md](desktop-and-cli.md) | NW.js desktop app, `piskel-cli`, embedding in piskelapp.com |

## Template

Copy this for a new spec. Keep sections that don't apply, with "None".

```markdown
# <Feature area>

## Purpose
One or two sentences: what this lets the user do, and why.

## Behavior
What the user can do and what happens. Bullet points, grouped by
sub-feature. Include defaults, limits and modifier keys.

### Edge cases
Behavior at the boundaries: empty sprite, single frame, max size,
transparent pixels, ...

## UI and shortcuts
Where the feature lives in the UI, and its default shortcuts.

## Settings
User settings that affect this feature, with their storage keys and defaults.

## Test gaps
Behavior described above that no test covers.

## Known issues
Bugs, oddities or dead code that are known and not yet fixed.
```

## Conventions

- `ctrl` means Ctrl on Windows/Linux and Cmd on macOS.
- Mark anything uncertain with _(to confirm)_ rather than guessing.
