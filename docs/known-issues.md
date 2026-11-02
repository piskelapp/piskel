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
- Touch listeners are attached to the window, not the canvas, so a tap
  anywhere (for example on a toolbar button) runs the current tool's
  press and release. Not reproduced.

## Colors and palettes

See [colors-and-palettes.md](specs/colors-and-palettes.md).

- `CurrentColorsService` defines `isCurrentColorsPaletteSelected_` and
  `loadColorsFromCache_` twice; the second `loadColorsFromCache_` drops
  the fallback that recomputes colors on a cache miss.

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
- GIF transparency and the too-many-colors warning have no automated test.
  `misc/gif-tests/` has sprites for checking them by hand.
- The "Selected frame" PNG is named `<title>-<n>.png.png`:
  `onDownloadSelectedFrameClick_` passes a name that already ends in
  `.png` to `downloadCanvas_`, which adds it again.

## Frames

See [frames.md](specs/frames.md).

- Deleting a hidden frame leaves its index in the hidden list, so the frame
  that takes its place becomes hidden. Found by reading
  `PiskelController.removeFrameAt`, not reproduced.
- Undo can lose hidden frames: see [Undo and redo](#undo-and-redo).
- Moving a frame un-hides the hidden frames outside the moved range: the
  `hiddenFrames.map` callback in `PiskelController.moveFrame` returns
  nothing for them. Not reproduced.

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
- Wrong file types are rejected without telling the user: a non-`.piskel`
  file in "Browse .piskel files", a non-image in "Browse images", several
  files in the wizard, or a palette file that fails to load on drop only
  log to the console.

## Keyboard shortcuts

See [keyboard-shortcuts.md](specs/keyboard-shortcuts.md).

- `MERGE_ANIMATION` (`ctrl+shift+M`, "Open merge animation popup") is
  declared and listed in the cheatsheet, but no handler is registered for
  it, so the key does nothing.
- Remapping a shortcut re-renders the tool list without the highlight on
  the selected tool (`ToolController.createToolsDom_`). Tooltips built at
  startup (preview sizes, onion skin, grid, layer preview) keep showing
  the old key.
- Cut, copy and paste look editable in the cheatsheet, but remapping them
  has no effect: they go through the browser's clipboard events, so
  `ctrl+X/C/V` keep working.
- The notification for a key taken from another shortcut shows that
  shortcut's internal id (e.g. `tool-pen`) instead of its description.

## Layers

See [layers.md](specs/layers.md).

- Setting the opacity uses a native `window.prompt`.
- Blurring the rename input discards the typed name. This may not be
  intended: the blur handler goes through the same path as `Escape`.
- Duplicating a layer resets its opacity to 1 (`LayerUtils.clone`).
- Merge down ignores the opacity of both layers; the merged layer is
  opaque (`LayerUtils.mergeLayers`).
- Dismissing the opacity prompt still records an undo step and marks the
  sprite as modified.

## Preview

See [preview.md](specs/preview.md).

- The popup preview always uses the low-contrast dark background,
  ignoring the background preference. Not reproduced.

## Save and storage

See [save-and-storage.md](specs/save-and-storage.md).

- `SettingsController` registers a `localstorage` drawer whose template
  and controller no longer exist. Dead entry.
- Loading `.piskel` files written by older model versions is only covered
  by unit tests (`Deserializer_v0`, `Deserializer_v1`).

## Selection

See [selection.md](specs/selection.md).

- With a selection active, copying text in a text field (layer name,
  sprite title) copies the pixel selection instead: the clipboard
  listeners run on the whole window. Not reproduced.
- A pasted clipboard image is placed at the window's top-left corner,
  converted to sprite coordinates, not at the sprite's top-left corner.

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
- Changing the FPS is neither an undo step nor an unsaved change, although
  FPS is saved in `.piskel` files. Each history state stores the FPS, so
  undoing any other change also reverts the FPS.
