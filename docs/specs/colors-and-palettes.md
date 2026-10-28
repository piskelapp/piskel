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
  Worker.
- The panel shows at most 256 colors of any palette.
- `1`–`9` select the corresponding color of the current palette as
  primary. `<` / `>` select the previous / next color.
- With more than 10 colors, swatches switch to a compact ("tiny") layout.
- **Create palette** (button or `alt+P`) opens the palette editor with an
  empty palette named "New palette". You can name it, add, remove, reorder
  and edit colors, then save. The new palette becomes the selected one.
- **Edit palette** opens the editor for the selected palette; from there it
  can be deleted (with confirmation) or downloaded as a `.gpl` file.
  Editing the **Current colors** palette instead creates a new palette,
  "Current colors clone", prefilled with the current colors.
- **Import**: when creating a palette, the editor can load a palette file.
  Supported formats: GIMP `.gpl`, `.pal`, `.txt`, and images (each distinct
  color of the image becomes a palette color). Palette files (`.gpl`,
  `.pal`, `.txt`) can also be dropped on the editor; the imported palette
  is saved and selected.
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
