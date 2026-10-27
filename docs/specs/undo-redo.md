# Undo and redo

## Purpose

Let users experiment freely: any change to the sprite can be undone.

## Behavior

- `undo-redo.shortcuts` `ctrl+Z` undoes the last change, `ctrl+Y` or
  `ctrl+shift+Z` redoes it. Several changes can be undone in a row.
- `undo-redo.recorded` Every change to the document is recorded: pixels
  (drawing tools, selection actions, transformations, imports) and
  structure (frames, layers, opacity, frame visibility, resize).
- `undo-redo.not-recorded` Selecting a frame, layer, tool or color, zoom
  and pan, preview settings and preferences are not recorded.
- `undo-redo.restore-position` Undo/redo also restores the frame and layer
  that were current when the change was made.
- `undo-redo.discard-redo` Making a new change after undoing discards the
  redo history.
- `undo-redo.throttle` Repeated key presses are throttled so the editor
  stays responsive when undo is held down.
- `undo-redo.memory-only` History is kept in memory only and starts fresh
  on each page load.
- `undo-redo.load-step` Loading or replacing a sprite (open, import,
  restore a backup) and resizing are recorded as a single step, so they
  can be undone too.
- `undo-redo.cap` The number of recorded states is capped
  (`MAX_SAVED_STATES` in the history service); the oldest states are
  dropped first.

## UI and shortcuts

No UI besides the shortcuts: `ctrl+Z`, `ctrl+Y`, `ctrl+shift+Z`.

## Settings

None.

## Known issues

- History snapshots don't preserve hidden frames correctly: the binary
  serializer used for history keeps only the last character of the hidden
  frames list, as a string. After an undo that goes through a snapshot,
  frames hidden before that snapshot can show up in the preview again.
  Found by reading `ArrayBufferDeserializer`, not reproduced.
