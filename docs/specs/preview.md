# Preview

## Purpose

See the animation play while editing, at a chosen speed and size, and see
neighboring frames while drawing.

## Behavior

### Animated preview

- Plays all visible frames (see hidden frames in [frames.md](frames.md))
  with all layers composed, in a loop, at the sprite's FPS.
- **FPS** slider below the preview, from 0 to the "maximum FPS" preference.
  0 stops the animation on the current frame. The FPS is part of the
  document (saved in `.piskel` files and used for GIF export).
- **Preview size** buttons:
  - `1x` (`alt+1`): original size.
  - Best (`alt+2`): the largest integer zoom that fits. The button is
    labeled with that zoom (e.g. `4x`).
  - `Full` (`alt+3`): fills the preview area.

  Only sizes that make sense for the current sprite are offered (e.g. only
  `Full` when the sprite is larger than the preview area).
- **Toggle grid** button on the preview toggles the canvas grid (same as
  `alt+G`).
- **Popup preview** button opens the preview in a separate, resizable
  window that stays in sync, and closes when the editor closes.

### Minimap

When the canvas is zoomed in so that the sprite does not fit, a frame on
the animated preview shows which part of the sprite is visible.

### Onion skin

- Toggled with `alt+O` or the button on the preview.
- When on, the previous and next frames of the current layer are drawn
  semi-transparently behind the current frame.

## UI and shortcuts

Animated preview at the top of the right column. Shortcuts: `alt+1`, `alt+2`, `alt+3`,
`alt+O`, `alt+G`.

## Settings

- `PREVIEW_SIZE` (default `"original"`)
- `MAX_FPS` (default `24`)
- `ONION_SKIN` (default `false`)

## Test gaps

- FPS slider changes and playback speed.
- Popup preview.
- Minimap.

## Known issues

None documented.
