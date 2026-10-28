# Canvas (drawing area)

## Purpose

The central area where the current frame is displayed and edited.

## Behavior

### Zoom and pan

- Mouse wheel zooms in and out around the cursor; with `ctrl` it zooms
  faster.
- `+` / `-` zoom in and out, `0` resets the zoom to fit the available space.
- Middle-button drag pans the view. `shift+arrow` keys pan by one pixel.
- When zoomed out so the sprite is smaller than the area, the background
  around it is a neutral gray.

### Mouse buttons

- Left: draw with the primary color. Right: draw with the secondary color.
  The browser context menu is suppressed on the canvas.
- Middle-click (without dragging) or `alt`+click picks the color under the
  cursor.

### Cursor coordinates

The bottom bar shows:

- the sprite size;
- `x:y` of the hovered pixel;
- while dragging (e.g. during a selection), the drag origin, the current
  position and the dragged size;
- the zoom level and the current frame as `index/count`.

### Rendering aids

- **Background**: a checkerboard behind transparent pixels. Four variants
  (light, medium, low-contrast medium, low-contrast dark) are chosen in
  preferences.
- **Layers**: other layers are drawn above and below the current one (see
  [layers.md](layers.md) for layer preview).
- **Onion skin**: see [preview.md](preview.md).
- **Grid**: optional pixel grid with configurable size, spacing and color
  (see [settings.md](settings.md)). Toggled with `alt+G` or the button on
  the animated preview.
- **Tile mode**: draws copies of the sprite around the canvas, behind a
  semi-transparent mask, to design seamless tiles (see
  [settings.md](settings.md)).

### Performance warning

Large sprites show a warning icon. Clicking it opens a dialog explaining
which factor is a problem. Thresholds: more than 512×512 pixels, more than
25 layers, more than 100 frames, 256 or more colors, or a combined score
of these factors that is too high (`PerformanceReport`).

## UI and shortcuts

The drawing area in the center column. Shortcuts: `+`, `-`, `0`,
`shift+up/down/left/right`, `alt+G`.

## Settings

- `CANVAS_BACKGROUND` (default `lowcont-dark-canvas-background`)
- `GRID_ENABLED`, `GRID_WIDTH`, `GRID_SPACING`, `GRID_COLOR`
- `SEAMLESS_MODE`, `SEAMLESS_OPACITY`

## Test gaps

- Mouse wheel zoom.
- Panning with `shift+arrow` keys.

## Known issues

- `should show drag origin during rectangle selection` is flaky.
