# Settings

## Purpose

User preferences that persist across sessions, and sprite-level settings
such as the canvas size.

## Behavior

Preferences are stored per browser (localStorage) and are not part of
`.piskel` files.

### Preferences drawer

Three tabs:

- **Misc**
  - **Background**: canvas checkerboard style, one of four.
  - **Layer opacity**: opacity of non-current layers on the canvas (see
    [layers.md](layers.md)).
  - **Maximum FPS**: upper bound of the preview FPS slider.
  - **Color format**: hex or RGB in the color pickers.
- **Grid**
  - Enable/disable the pixel grid.
  - **Grid size**: line width, 1 to 4 px.
  - **Grid spacing**: 1, 2, 4, 8, 16, 32 or 64 sprite pixels between lines.
  - **Grid color**: one of 14 colors.
- **Tile mode**
  - Enable/disable tile (seamless) mode: the sprite is repeated around the
    canvas so that edges can be matched.
  - **Mask opacity**: opacity of the mask over the repeated copies (0 to
    0.5).

### Resize drawer

- **Resize canvas**: new width and height (max 1024×1024).
  - **Maintain aspect ratio** links width and height.
  - **Resize canvas content** scales the pixels to the new size; otherwise
    the content keeps its size and is cropped or padded.
  - **Anchor** (9 positions) decides where existing content is placed when
    not resizing content.
  - Applies to all frames and layers; one undo step.
- **Default size**: width and height used for new sprites, with a "Set
  default" button.

## UI and shortcuts

Right toolbar: Preferences (gear icon) and Resize drawers. `Escape` or clicking outside closes
the open drawer.

## Settings

All keys and defaults are declared in `UserSettings`. The ones
managed here: `CANVAS_BACKGROUND`, `LAYER_OPACITY`, `MAX_FPS`,
`COLOR_FORMAT`, `GRID_ENABLED`, `GRID_WIDTH`, `GRID_SPACING`,
`GRID_COLOR`, `SEAMLESS_MODE`, `SEAMLESS_OPACITY`, `RESIZE_SETTINGS`,
`DEFAULT_SIZE`, `PREFERENCES_TAB`.

## Test gaps

- Maximum FPS changing the preview slider range.
- Resize with "maintain aspect ratio" off.

## Known issues

None documented.
