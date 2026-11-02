# Colors and palettes

## Purpose

Choose the colors to draw with, and keep reusable sets of colors
(palettes).

## Behavior

### Primary and secondary colors

- Two colors are active at all times: primary (left button) and secondary
  (right button). Defaults: black and transparent.
- Each opens a color picker (Spectrum) when clicked. Colors can be typed in
  hex or RGB depending on the "color format" preference.
- `X` or the swap button swaps them. `D` resets them to the defaults.
- The color picker tool, `alt`+click and middle-click on the canvas pick
  colors from the sprite (see [drawing-tools.md](drawing-tools.md)).

### Palettes

- The palettes panel shows the selected palette's colors as swatches.
  Left-click a swatch to set the primary color, right-click to set the
  secondary color.
- **Current colors** is a built-in, always-present palette listing the
  colors used in the sprite, updated as you draw. It is computed in a Web
  Worker and capped at 256 colors.
- `1`–`9` select the corresponding color of the current palette as
  primary. `<` / `>` select the previous / next color.
- With more than 10 colors, swatches switch to a compact ("tiny") layout.
- **Create palette** (button or `alt+P`) opens the palette editor, prefilled
  from the current colors. You can name it, add, remove, reorder and edit
  colors, then save. The new palette becomes the selected one.
- **Edit palette** opens the editor for the selected palette; from there it
  can be deleted (with confirmation) or downloaded as a `.gpl` file.
- **Import**: the palette editor can load a palette file. Supported formats:
  GIMP `.gpl`, `.pal`, `.txt`, and images (each distinct color of the image
  becomes a palette color). Palette files can also be dropped on the editor.
- Palettes are stored in the browser (localStorage), not in `.piskel` files.

## UI and shortcuts

- Color pickers at the bottom of the left toolbar.
- Palettes panel in the right column, palette editor dialog.
- Shortcuts: `X`, `D`, `alt+P`, `1`–`9`, `<`, `>`.

## Settings

- `SELECTED_PALETTE` (default: the current colors palette)
- `COLOR_FORMAT` (default `"hex"`)

## Test gaps

- `<` / `>` shortcuts.
- Importing `.pal`, `.txt` and image palettes; dropping palette files.
- Right-click on a swatch.

## Known issues

None documented.
