# Colors and palettes

## Purpose

Choose the colors to draw with, and keep reusable sets of colors
(palettes).

## Behavior

### Primary and secondary colors

- `colors-and-palettes.defaults` Two colors are active at all times:
  primary (left button) and secondary (right button). Defaults: black and
  transparent.
- `colors-and-palettes.picker` Each opens a color picker (Spectrum) when
  clicked. Colors can be typed in hex or RGB depending on the "color
  format" preference.
- `colors-and-palettes.swap` `X` or the swap button swaps them.
- `colors-and-palettes.reset` `D` resets them to the defaults.

The color picker tool, `alt`+click and middle-click on the canvas pick
colors from the sprite (see [drawing-tools.md](drawing-tools.md) and
[canvas.md](canvas.md)).

### Palettes

- `colors-and-palettes.swatches` The palettes panel shows the selected
  palette's colors as swatches. Left-click a swatch to set the primary
  color.
- `colors-and-palettes.swatch-right-click` Right-click a swatch to set the
  secondary color.
- `colors-and-palettes.current-colors` **Current colors** is a built-in,
  always-present palette listing the colors used in the sprite, updated as
  you draw. It is the default palette.
- `colors-and-palettes.max-colors` The panel shows at most 256 colors of
  any palette.
- `colors-and-palettes.number-keys` `1`–`9` select the corresponding color
  of the current palette as primary.
- `colors-and-palettes.prev-next` `<` / `>` select the previous / next
  color.
- `colors-and-palettes.tiny` With more than 10 colors, swatches switch to
  a compact ("tiny") layout.
- `colors-and-palettes.create` **Create palette** (button or `alt+P`)
  opens the palette editor with an empty palette named "New palette". You
  can name it, add, remove, reorder and edit colors, then save or cancel.
  A saved palette becomes the selected one.
- `colors-and-palettes.edit` **Edit palette** opens the editor for the
  selected palette.
- `colors-and-palettes.delete` From the editor, a palette can be deleted,
  after confirmation.
- `colors-and-palettes.download` From the editor, a palette can be
  downloaded as a `.gpl` file.
- `colors-and-palettes.clone-current` Editing the **Current colors**
  palette instead creates a new palette, "Current colors clone",
  prefilled with the current colors.
- `colors-and-palettes.import` When creating a palette, the editor can
  load a palette file. Supported formats: GIMP `.gpl`, `.pal`, `.txt`, and
  images (each distinct color of the image becomes a palette color).
- `colors-and-palettes.drop` Palette files (`.gpl`, `.pal`, `.txt`) can
  also be dropped on the editor; the imported palette is saved and
  selected.
- `colors-and-palettes.storage` Palettes are stored in the browser
  (localStorage), not in `.piskel` files.

## UI and shortcuts

- Color pickers at the bottom of the left toolbar.
- Palettes panel in the right column, palette editor dialog.
- Shortcuts: `X`, `D`, `alt+P`, `1`–`9`, `<`, `>`.

## Settings

- `SELECTED_PALETTE` (default: the current colors palette)
- `COLOR_FORMAT` (default `"hex"`)

## Known issues

None documented.
