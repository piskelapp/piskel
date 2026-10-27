# Preview

## Purpose

See the animation play while editing, at a chosen speed and size, and see
neighboring frames while drawing.

## Behavior

### Animated preview

- `preview.playback` Plays all visible frames (see hidden frames in
  [frames.md](frames.md)) with all layers composed, in a loop, at the
  sprite's FPS.
- `preview.fps` The FPS slider below the preview goes from 0 to the
  "maximum FPS" preference. 0 stops the animation on the current frame.
  New sprites play at 12 FPS.
- `preview.fps-saved` The FPS is part of the document: it is saved in
  `.piskel` files and used for GIF export.
- `preview.sizes` Three preview sizes are available:
  - `1x` (`alt+1`): original size. This is the default.
  - Best (`alt+2`): the largest integer zoom that fits. The button is
    labeled with that zoom (e.g. `4x`).
  - `Full` (`alt+3`): fills the preview area.
- `preview.size-options` Only sizes that make sense for the current sprite
  are offered (e.g. only `Full` when the sprite is larger than the preview
  area).
- `preview.toggle-grid` The toggle grid button on the preview toggles the
  canvas grid (same as `alt+G`).
- `preview.popup` The popup preview button opens the preview in a
  separate, resizable window that stays in sync, and closes when the
  editor closes.

### Minimap

- `preview.minimap` When the canvas is zoomed in so that the sprite does
  not fit, a frame on the animated preview shows which part of the sprite
  is visible. It follows panning and zooming, and disappears when the
  whole sprite fits again.

### Onion skin

- `preview.onion-skin-toggle` Onion skin is toggled with `alt+O` or the
  button on the preview. Off by default.
- `preview.onion-skin` When on, the previous and next frames of the
  current layer are drawn semi-transparently behind the current frame.

## UI and shortcuts

Animated preview at the top of the right column. Shortcuts: `alt+1`, `alt+2`, `alt+3`,
`alt+O`, `alt+G`.

## Settings

- `PREVIEW_SIZE` (default `"original"`)
- `MAX_FPS` (default `24`)
- `ONION_SKIN` (default `false`)

## Known issues

None documented.
