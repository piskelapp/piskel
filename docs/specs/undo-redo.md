# Undo and redo

## Purpose

Let users experiment freely: any change to the sprite can be undone.

## Behavior

- `ctrl+Z` undoes the last change, `ctrl+Y` or `ctrl+shift+Z` redoes it.
- **What is recorded**: every change to the document, meaning pixels
  (drawing tools, selection actions, transformations, imports) and
  structure (frames, layers, opacity, frame visibility, resize).
- **What is not recorded**: selecting a frame, layer, tool or color, zoom
  and pan, preview settings and preferences.
- Undo/redo also restores the frame and layer that were current when the
  change was made.
- Making a new change after undoing discards the redo history.
- Repeated key presses are throttled so the editor stays responsive when
  undo is held down.
- History is kept in memory only and starts fresh on each page load.
- Loading or replacing a sprite (open, import, restore a backup) and
  resizing are recorded as a single step, so they can be undone too.
- The number of recorded states is capped (`MAX_SAVED_STATES` in the
  history service); the oldest states are dropped first.

## UI and shortcuts

No UI besides the shortcuts: `ctrl+Z`, `ctrl+Y`, `ctrl+shift+Z`.

## Settings

None.

## Test gaps

- Undo of layer operations other than add (merge, move, opacity, rename).
- Undo of import, resize and selection actions.
- Restoring the current frame and layer on undo.
- Behavior beyond the state cap.

## Known issues

- History snapshots don't preserve hidden frames correctly: the binary
  serializer used for history keeps only the last character of the hidden
  frames list, as a string. After an undo that goes through a snapshot,
  frames hidden before that snapshot can show up in the preview again.
  Found by reading `ArrayBufferDeserializer`, not reproduced.
