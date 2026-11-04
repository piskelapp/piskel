# Settings

## Purpose

User preferences that persist across sessions, and sprite-level settings
such as the canvas size.

## Behavior

- `settings.storage` Preferences are saved in this browser
  and are not part of `.piskel` files.
- `settings.drawers` The Preferences (gear icon) and Resize drawers open
  from the right toolbar. `Escape` or clicking outside closes the open
  drawer.
- `settings.drawer-toggle` Clicking the icon of the open drawer closes it.

### Preferences drawer

Three tabs: Misc, Grid and Tile mode.

- `settings.last-tab` The drawer reopens on the last tab used (Misc by
  default).

- `settings.background` **Background** (Misc): canvas checkerboard style,
  one of four, low-contrast dark by default.
- `settings.layer-opacity` **Layer opacity** (Misc): opacity of
  non-current layers on the canvas when layer preview is on (see
  [layers.md](layers.md)), 0.2 by default. Not to be confused with the
  opacity of a layer itself, set with the α button of the layer: the two are
  multiplied.
- `settings.max-fps` **Maximum FPS** (Misc): upper bound of the preview
  FPS slider, 24 by default. An invalid value is reverted. See
  [preview.md](preview.md) for its effect on the sprite's FPS.
- `settings.color-format` **Color format** (Misc): hex or RGB in the color
  pickers, hex by default.
- `settings.grid-enabled` **Grid** (Grid): enable/disable the pixel grid.
  Off by default.
- `settings.grid-width` **Grid size** (Grid): line width, 1 to 4 px, 1 by
  default.
- `settings.grid-spacing` **Grid spacing** (Grid): 1, 2, 4, 8, 16, 32 or
  64 sprite pixels between lines, 1 by default.
- `settings.grid-color` **Grid color** (Grid): one of 14 colors,
  transparent by default. A transparent grid cuts the lines out of the
  sprite, showing the background.
- `settings.tile-mode` **Tile mode** (Tile mode): enable/disable tile
  (seamless) mode, where the sprite is repeated around the canvas so that
  edges can be matched. Off by default.
- `settings.tile-opacity` **Mask opacity** (Tile mode): opacity of the
  mask over the repeated copies, from 0 to 0.5, 0.3 by default.
- `settings.persist` Changed preferences are kept when the drawer is
  closed and reopened, and across reloads.

### Resize drawer

- `settings.resize` **Resize canvas** sets a new width and height for all
  frames and layers, in one undo step. No maximum is enforced.
- `settings.resize-ratio` **Maintain aspect ratio** links width and
  height; unchecked, they can be set independently.
- `settings.resize-content` **Resize canvas content** scales the pixels to
  the new size; otherwise the content keeps its size and is cropped or
  padded.
- `settings.resize-anchor` **Anchor** (9 positions) decides where existing
  content is placed when not resizing content. It is disabled when
  resizing content.
- `settings.resize-saved` The resize options are remembered across
  sessions: maintain aspect ratio on, resize content off and anchor
  top-left by default.
- `settings.default-size` **Default size**: width and height used for new
  sprites (32×32 out of the box), with a "Set default" button. Persisted
  across reloads. An empty or 0 value keeps the previous default. Sizes above
  4096 are capped, including a value already saved by an older version.

## UI and shortcuts

Right toolbar: Preferences (gear icon) and Resize drawers.
