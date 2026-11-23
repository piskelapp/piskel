# Save and storage

## Purpose

Keep work safe: save sprites to continue later, recover from crashes or
closed tabs, and never lose changes silently.

## Behavior

### Sprite name and description

- `save-and-storage.descriptor` The Save drawer has **title** and
  **description** fields. Edits apply to the sprite when it is saved, with
  any save button or `Enter` in the form; closing the drawer without
  saving discards them.
- `save-and-storage.header-name` The sprite title is shown in the header.
- `save-and-storage.file-names` The sprite title names downloaded files:
  `.piskel` files are named `<title>-<date>-<time>.piskel`, and exports
  `<title>.<ext>`. The selected frame is `<title>-<n>.png`.

### Save in browser

- `save-and-storage.browser-save` The **Save in Browser** button, or
  `ctrl+S`, saves the sprite in this browser under its title.
- `save-and-storage.browser-overwrite` Saving again with the same title
  overwrites the previous save without asking.
- `save-and-storage.save-feedback` A save shows a confirmation message, or
  an error message if it fails. A successful save closes the drawer. After a
  failed one, the drawer stays open and the `*` stays. While a save runs, the
  save buttons are disabled.
- `save-and-storage.browse-local` **Browse local saves** (Import drawer)
  lists saved sprites with their date, newest first.
- `save-and-storage.browse-local-load` A listed sprite can be loaded,
  replacing the current sprite, after confirmation.
- `save-and-storage.browse-local-delete` A listed sprite can be deleted,
  after confirmation.

### Save as `.piskel` file

- `save-and-storage.piskel-file` **Save as .piskel** downloads the sprite
  as a `.piskel` file (JSON), which can be loaded back from the Import
  drawer or by drag and drop with identical content.

### What a save contains

- `save-and-storage.saved-content` A browser save, a `.piskel` file and a backup
  keep the whole sprite: its size, frames, hidden frames, FPS, title and
  description, and its layers with their names and opacity.

### Unsaved changes

- `save-and-storage.dirty-indicator` The header shows the sprite name,
  followed by `*` when there are unsaved changes. Saving clears the `*`.
- `save-and-storage.dirty-undo` Undoing or redoing back to the saved state
  clears the `*`. Moving away from that state shows it again. A new sprite
  counts as saved.
- `save-and-storage.unload-confirm` Closing or reloading the page with
  unsaved changes asks for confirmation; without unsaved changes it
  doesn't.

### Backups

- `save-and-storage.backup` Every minute, if the sprite changed, a backup
  is saved in the browser. A new snapshot is kept
  every 5 minutes, otherwise the latest one is updated.
- `save-and-storage.backup-limits` Up to 12 snapshots are kept per session
  (one session = one page load), and up to 10 sessions.
- `save-and-storage.backup-on-close` A last backup is attempted when the
  page is closed.
- `save-and-storage.browse-backups` **Browse backups** (Import drawer)
  lists previous sessions (not the current one) and their snapshots, each
  with a preview, its date, frame count, size and FPS. Any snapshot can be
  restored, after confirmation, replacing the current sprite.
- `save-and-storage.backups-order` **Browse backups** lists sessions and their
  snapshots newest first.
- `save-and-storage.backups-delete` A whole session can be deleted from
  the list, after confirmation.
- `save-and-storage.backups-delete-cancel` Cancelling the confirmation keeps
  the session.

## UI and shortcuts

- Save drawer.
- Import drawer: browse local saves, browse backups.
- Header (sprite name and unsaved indicator).
- Shortcuts: `ctrl+S`.
