# Canvas (drawing area)

## Purpose

The central area where the current frame is displayed and edited.

## Behavior

### Zoom and pan

- `canvas.wheel-zoom` Mouse wheel zooms in and out around the cursor;
  with `ctrl` it zooms faster.
- `canvas.zoom-shortcuts` `+` / `-` zoom in and out, `0` resets the zoom
  to fit the available space.
- `canvas.middle-drag-pan` Middle-button drag pans the view.
- `canvas.keyboard-pan` `shift+arrow` keys pan by one pixel.
- `canvas.zoom-limits` Zooming out stops at one screen pixel per sprite
  pixel; zooming in stops when 10 sprite pixels no longer fit. Panning
  stops at the sprite's edges.
- `canvas.fit-on-resize` When the sprite size changes (resize, crop, or
  undoing and redoing these) or a sprite is loaded, even of the same size,
  zoom and pan reset to fit the sprite. Resizing the window keeps the zoom
  relative to the available space.
- `canvas.zoomed-out-background` When zoomed out so the sprite is smaller
  than the area, the background around it is a neutral gray.

### Mouse

- `canvas.no-context-menu` The browser context menu is suppressed on the
  canvas, so the right button can draw (see
  [drawing-tools.md](drawing-tools.md)).
- `canvas.pick-color` Middle-click (without dragging) or `alt`+click picks
  the color under the cursor, with any tool except move (where `alt`
  wraps). The left button sets the primary color, the right button the
  secondary color.
- `canvas.touch` Touch input draws like the left mouse button.

### Cursor coordinates

The bottom bar shows:

- `canvas.coords-size` the sprite size;
- `canvas.coords-hover` `x:y` of the hovered pixel;
- `canvas.coords-drag` while dragging (e.g. during a selection), the drag
  origin, the current position and the dragged size, cleared on release;
- `canvas.coords-zoom` the zoom level;
- `canvas.coords-frame` the current frame as `index/count`.

### Rendering aids

- `canvas.background` A checkerboard is drawn behind transparent pixels.
  Four variants (light, medium, low-contrast medium, low-contrast dark)
  are chosen in preferences; low-contrast dark is the default.
- `canvas.grid` An optional pixel grid is drawn over the sprite, with
  configurable size, spacing and color (see [settings.md](settings.md)).
  `alt+G` toggles it.
- `canvas.grid-zoom` The grid is hidden when its lines would be less than
  6 screen pixels apart. When zoomed out it's drawn thinner: a line is at
  most 1/6 of a sprite pixel wide, and never under 1 screen pixel.
- `canvas.tile-mode` Tile mode draws copies of the sprite around the
  canvas, behind a semi-transparent mask, to design seamless tiles (see
  [settings.md](settings.md)).

Other layers and onion skin are drawn on the canvas too, see
[layers.md](layers.md) and [preview.md](preview.md).

### Performance warning

- `canvas.performance-warning` Large sprites show a warning icon.
  Thresholds: more than 512×512 pixels, more than 25 layers, more than 100
  frames, 256 or more colors, or a combined score of these factors that is
  too high.
- `canvas.performance-notification` When the icon first appears, a
  notification "Performance problem detected" also shows, with a link to
  the dialog.
- `canvas.performance-dialog` Clicking the warning icon opens a dialog
  listing the factors that affect performance (resolution, layers, frames,
  colors), with recommended limits. It closes with its close button or
  `Escape`.

## UI and shortcuts

The drawing area in the center column. Shortcuts: `+`, `-`, `0`,
`shift+up/down/left/right`, `alt+G`.
