# Known issues

Bugs, oddities and dead code found while writing the
[feature specs](specs/README.md). They are not filed as GitHub issues
yet. When one is fixed, remove it from this list; when one is filed,
link the issue.

## CLI

- The CLI is broken: `cli/index.js` requires `phantomjs`, which is not a
  dependency in `package.json`, so it fails with
  `Cannot find module 'phantomjs'`.

## Canvas (drawing area)

See [canvas.md](specs/canvas.md).

- `should show drag origin during rectangle selection` is flaky.

## Drawing tools

See [drawing-tools.md](specs/drawing-tools.md).

- The test `should not go below size 1 or above size 4` passes, but `]` does
  raise the size to 5. The helper reads `data-size` of the selected option,
  which stays `4`. Either the test or the behavior should change _(to
  confirm which)_.

## Export

See [export.md](specs/export.md).

- ZIP frame numbers start at 0 for a merged export but at 1 when split by
  layers.

## Frames

See [frames.md](specs/frames.md).

- Deleting a hidden frame leaves its index in the hidden list, so the frame
  that takes its place becomes hidden. Found by reading
  `PiskelController.removeFrameAt`, not reproduced.
- Undo can lose hidden frames: see [Undo and redo](#undo-and-redo).

## Import

See [import.md](specs/import.md).

- When dropping several images, each new frame is selected and then
  `selectNextFrame` moves one frame further, so unless the current frame is
  the last one, images are drawn on existing frames rather than on the new
  empty ones. Found by reading `FileDropperService.onImageLoaded_`, not
  reproduced.
- `onRestorePreviousSessionClick_` in `ImportController` is not wired
  to any element. Likely dead code left over from before the backups
  dialog.

## Keyboard shortcuts

See [keyboard-shortcuts.md](specs/keyboard-shortcuts.md).

- `MERGE_ANIMATION` (`ctrl+shift+M`, "Open merge animation popup") is
  declared and listed in the cheatsheet, but no handler is registered for
  it, so the key does nothing.

## Layers

See [layers.md](specs/layers.md).

- Setting the opacity uses a native `window.prompt`.
- Blurring the rename input discards the typed name. This may not be
  intended: the blur handler goes through the same path as `Escape`.

## Save and storage

See [save-and-storage.md](specs/save-and-storage.md).

- `SettingsController` registers a `localstorage` drawer whose template
  and controller no longer exist. Dead entry.

## Settings

See [settings.md](specs/settings.md).

- `Constants.MAX_WIDTH` / `MAX_HEIGHT` (1024) are declared but not used:
  nothing caps the sprite size.

## Transformations

See [transformations.md](specs/transformations.md).

- Crop does nothing when the content (or selection) is a single column
  wide (`Crop.applyTool_` treats `minx >= maxx` as empty).

## Undo and redo

See [undo-redo.md](specs/undo-redo.md).

- History snapshots don't preserve hidden frames correctly: the binary
  serializer used for history keeps only the last character of the hidden
  frames list, as a string. After an undo that goes through a snapshot,
  frames hidden before that snapshot can show up in the preview again.
  Found by reading `ArrayBufferDeserializer`, not reproduced.
