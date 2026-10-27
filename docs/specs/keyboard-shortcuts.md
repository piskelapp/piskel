# Keyboard shortcuts

## Purpose

Make every frequent action reachable from the keyboard, and let users
adapt the keys to their habits.

## Behavior

### Default shortcuts

The full list, with descriptions, is shown in the cheatsheet. It is
grouped into these categories:

- **Tools**: one letter per tool (see [drawing-tools.md](drawing-tools.md)
  and [selection.md](selection.md)).
- **Selection**: `ctrl+X`, `ctrl+C`, `ctrl+V`, `Del`/`Backspace`, `Enter`.
- **Misc**:
  - zoom: `0`, `+`, `-`;
  - pen size: `[`, `]`;
  - undo/redo: `ctrl+Z`, `ctrl+Y` / `ctrl+shift+Z`;
  - frames: `up`, `down`, `N`, `shift+N`;
  - preview and display: `alt+1/2/3`, `alt+O`, `alt+G`, `alt+L`;
  - cheatsheet: `?`;
  - close popup: `Escape`;
  - pan: `shift+arrows`.
- **Storage**: `ctrl+S`; desktop only: `ctrl+O`, `ctrl+shift+S`.
- **Colors**: `X`, `D`, `alt+P`, `<`, `>`, `1`–`9`.

What each shortcut does is specified with the feature it triggers. The
claims here are about the shortcut system itself:

- `keyboard-shortcuts.tool-keys` Each tool is selected by its key, and
  switching tools by click or by key can be mixed freely.
- `keyboard-shortcuts.escape` `Escape` closes the open dialog or settings
  drawer.
- `keyboard-shortcuts.ctrl-cmd` `ctrl` maps to Cmd on macOS.
- `keyboard-shortcuts.ignore-inputs` Shortcuts are ignored while typing in
  a text input.

### Cheatsheet

- `keyboard-shortcuts.cheatsheet-open` `?` or the link in the bottom bar
  opens the cheatsheet dialog. `?`, `Escape` or the close button closes it.
- `keyboard-shortcuts.cheatsheet-content` The cheatsheet lists every
  shortcut by category with its current keys.

### Remapping

- `keyboard-shortcuts.remap` In the cheatsheet, editable shortcuts are
  marked. Click one, then press the new key combination. Clicking
  elsewhere cancels editing.
- `keyboard-shortcuts.forbidden-keys` Some keys cannot be remapped
  (`1`–`9`, `?`, `Del`, `Backspace`, `Enter`, `ctrl+Y`, `ctrl+shift+Z`);
  trying shows a notification. Shortcuts bound to several keys (e.g. redo,
  delete) are not editable.
- `keyboard-shortcuts.conflict` If the new key was already used by another
  shortcut, it is removed from that shortcut and a notification says so.
- `keyboard-shortcuts.restore-defaults` **Restore default shortcuts**
  resets all of them, after confirmation.
- `keyboard-shortcuts.persist` Custom keys are persisted per browser.

## UI and shortcuts

Cheatsheet dialog, opened with
`?`.

## Settings

Custom keys are stored as user settings, one key per shortcut (not part of
the declared settings with defaults).

## Known issues

- `MERGE_ANIMATION` (`ctrl+shift+M`, "Open merge animation popup") is
  declared and listed in the cheatsheet, but no handler is registered for
  it, so the key does nothing.
