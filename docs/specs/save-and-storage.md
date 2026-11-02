# Save and storage

## Purpose

Keep work safe: save sprites to continue later, recover from crashes or
closed tabs, and never lose changes silently.

## Behavior

### Sprite name and description

The Save drawer has **title** and **description** fields. They are stored
in the sprite (`Descriptor`), shown in the header, and used as file names.

### Save in browser

- **Save in Browser** button, or `ctrl+S` on the web: saves the sprite in
  IndexedDB under its title. Saving again with the same title overwrites it.
- **Browse local saves** (Import drawer) lists saved sprites with their
  date; each can be loaded (replacing the current sprite) or deleted.
- Sprites saved by old versions in localStorage are migrated to IndexedDB.

### Save as `.piskel` file

**Save as .piskel** downloads the sprite as a `.piskel` file (JSON, see
[architecture.md](../architecture.md#persistence)). It can be loaded back
from the Import drawer or by drag and drop. Files saved by any older
version of Piskel must keep loading.

### Desktop (NW.js)

- **Save** (`ctrl+S`) writes to the file the sprite was opened from or last
  saved to; the first time, it asks for a location.
- **Save as...** (`ctrl+shift+S`) always asks for a location.
- **Open** (`ctrl+O`) opens a `.piskel` file.
- The browser-only options are not shown.

### Unsaved changes

- The header shows the sprite name, followed by `*` when there are unsaved
  changes. Undoing back to the saved state clears the `*`.
- Closing or reloading the page with unsaved changes asks for
  confirmation.

### Backups

- Every minute, if the sprite changed, a backup is written to a separate
  IndexedDB database. A new snapshot is kept every 5 minutes, otherwise the
  latest one is updated.
- Up to 12 snapshots are kept per session (one session = one page load),
  and up to 10 sessions.
- A last backup is attempted when the page is closed.
- **Browse backups** (Import drawer) lists previous sessions and their
  snapshots; any snapshot can be restored, replacing the current sprite.

## UI and shortcuts

- Save drawer.
- Import drawer: browse local saves, browse backups.
- Header (sprite name and unsaved indicator).
- Shortcuts: `ctrl+S`; desktop only: `ctrl+shift+S`, `ctrl+O`.

## Settings

None.

## Test gaps

- Overwriting an existing browser save; deleting a browser save.
- Loading `.piskel` files written by older model versions (only covered by
  unit tests for `Deserializer_v0` / `Deserializer_v1`).
- Restoring a specific snapshot from the backups dialog.
- Unsaved-changes confirmation on page close.
- Desktop save/open (no automated tests).

## Known issues

- `SettingsController` registers a `localstorage` drawer whose template
  and controller no longer exist. Dead entry.
