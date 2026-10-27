# Save and storage

## Purpose

Keep work safe: save sprites to continue later, recover from crashes or
closed tabs, and never lose changes silently.

## Behavior

### Sprite name and description

- `save-and-storage.descriptor` The Save drawer has **title** and
  **description** fields. They are stored in the sprite (`Descriptor`) and
  kept when the drawer is reopened.
- `save-and-storage.header-name` The sprite title is shown in the header.
- `save-and-storage.file-names` The sprite title is used as the default
  name of saved and exported files.

### Save in browser

- `save-and-storage.browser-save` The **Save in Browser** button, or
  `ctrl+S` on the web, saves the sprite in IndexedDB under its title.
- `save-and-storage.browser-overwrite` Saving again with the same title
  overwrites the previous save without asking.
- `save-and-storage.browse-local` **Browse local saves** (Import drawer)
  lists saved sprites with their date.
- `save-and-storage.browse-local-load` A listed sprite can be loaded,
  replacing the current sprite. When the current sprite has unsaved
  changes, loading asks for confirmation first.
- `save-and-storage.browse-local-delete` A listed sprite can be deleted,
  after confirmation.
- `save-and-storage.local-storage-migration` Sprites saved by old versions
  in localStorage are migrated to IndexedDB.

### Save as `.piskel` file

- `save-and-storage.piskel-file` **Save as .piskel** downloads the sprite
  as a `.piskel` file (JSON), which can be loaded back from the Import
  drawer or by drag and drop with identical content.
- `save-and-storage.piskel-compat` Files saved by any older version of
  Piskel must keep loading.

### Desktop (NW.js)

- `save-and-storage.desktop-save` **Save** (`ctrl+S`) writes to the file
  the sprite was opened from or last saved to; the first time, it asks for
  a location.
- `save-and-storage.desktop-save-as` **Save as...** (`ctrl+shift+S`)
  always asks for a location.
- `save-and-storage.desktop-open` **Open** (`ctrl+O`) opens a `.piskel`
  file.
- `save-and-storage.desktop-no-browser-options` The browser-only options
  are not shown.

### Unsaved changes

- `save-and-storage.dirty-indicator` The header shows the sprite name,
  followed by `*` when there are unsaved changes. Saving clears the `*`.
- `save-and-storage.dirty-undo` Undoing back to the saved state clears the
  `*`.
- `save-and-storage.unload-confirm` Closing or reloading the page with
  unsaved changes asks for confirmation; without unsaved changes it
  doesn't.

### Backups

- `save-and-storage.backup` Every minute, if the sprite changed, a backup
  is written to a separate IndexedDB database. A new snapshot is kept
  every 5 minutes, otherwise the latest one is updated.
- `save-and-storage.backup-limits` Up to 12 snapshots are kept per session
  (one session = one page load), and up to 10 sessions.
- `save-and-storage.backup-on-close` A last backup is attempted when the
  page is closed.
- `save-and-storage.browse-backups` **Browse backups** (Import drawer)
  lists previous sessions and their snapshots; any snapshot can be
  restored, replacing the current sprite.

## UI and shortcuts

- Save drawer.
- Import drawer: browse local saves, browse backups.
- Header (sprite name and unsaved indicator).
- Shortcuts: `ctrl+S`; desktop only: `ctrl+shift+S`, `ctrl+O`.

## Settings

None.

## Known issues

- `SettingsController` registers a `localstorage` drawer whose template
  and controller no longer exist. Dead entry.
- Loading `.piskel` files written by older model versions is only covered
  by unit tests (`Deserializer_v0`, `Deserializer_v1`).
