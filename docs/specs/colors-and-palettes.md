# Colors and palettes

## Purpose

Choose the colors to draw with, and keep reusable sets of colors
(palettes).

## Behavior

### Primary and secondary colors

- `colors-and-palettes.defaults` Two colors are active at all times:
  primary (left button) and secondary (right button). Defaults: black and
  transparent.
- `colors-and-palettes.picker` Each opens a color picker when
  clicked. Colors can be typed in hex or RGB depending on the "color
  format" preference.
- `colors-and-palettes.swap` `X` or the swap button swaps them.
- `colors-and-palettes.reset` `D` resets them to the defaults.
- `colors-and-palettes.picker-opaque` The color pickers offer a transparent
  swatch; any other color they produce is fully opaque.

The color picker tool, `alt`+click and middle-click on the canvas pick
colors from the sprite (see [drawing-tools.md](drawing-tools.md) and
[canvas.md](canvas.md)).

### Palettes

- `colors-and-palettes.swatches` The palettes panel shows the selected
  palette's colors as swatches. Left-click a swatch to set the primary
  color.
- `colors-and-palettes.swatch-right-click` Right-click a swatch to set the
  secondary color.
- `colors-and-palettes.select-palette` A dropdown in the palettes panel
  chooses the palette shown. The choice is remembered across sessions.
- `colors-and-palettes.swatch-highlight` The swatches of the current
  primary and secondary colors are highlighted. An empty palette shows a
  "No color in this palette" message.
- `colors-and-palettes.swatch-same-color` When both colors are the same, its
  swatch shows the primary highlight.
- `colors-and-palettes.current-colors` **Current colors** is a built-in,
  always-present palette listing the colors used in the sprite, updated as
  you draw. It is the default palette.
- `colors-and-palettes.current-colors-order` Current colors gathers the
  colors of every layer and frame, without transparent, and not in order of
  use: very dark colors by lightness, then very bright colors by lightness,
  then grayish colors by hue, then all other colors by hue.
- `colors-and-palettes.max-colors` The panel shows at most 256 colors of
  any palette.
- `colors-and-palettes.number-keys` `1`–`9` select the corresponding color
  of the current palette as primary.
- `colors-and-palettes.number-keys-range` A number past the end of the palette
  does nothing.
- `colors-and-palettes.prev-next` `<` / `>` select the previous / next
  color.
- `colors-and-palettes.prev-next-ends` `<` and `>` stop at the first and last
  colors, without wrapping around.
- `colors-and-palettes.tiny` With more than 10 colors, swatches switch to
  a compact ("tiny") layout.

### Palette dialog

- `colors-and-palettes.create` **Create palette** (button or `alt+P`)
  opens the palette dialog with a palette named "New palette" holding one
  black color. You can name it, add colors ("+" adds a copy of the
  selected color), remove, reorder and edit them, then save or cancel. A
  saved palette becomes the selected one.
- `colors-and-palettes.palette-dialog-add-copy` "+" adds a copy of the selected
  color at the end of the list, and selects it.
- `colors-and-palettes.palette-dialog-edit-color` Typing a hex value changes the
  selected color.
- `colors-and-palettes.palette-dialog-reorder` Dragging a color moves it in the
  list, and selects it. The saved palette keeps that order.
- `colors-and-palettes.empty-palette` All the colors can be removed, and the
  palette can be saved empty.
- `colors-and-palettes.palette-dialog-buttons` When creating a palette, the
  dialog offers importing a file, but not downloading or deleting. When editing
  one, it offers downloading and deleting, but not importing.
- `colors-and-palettes.palette-dialog-cancel` Cancelling discards all the changes
  made in the dialog.
- `colors-and-palettes.edit` **Edit palette** opens the dialog for the
  selected palette.
- `colors-and-palettes.edit-save` Saving an edited palette replaces it, with its
  new name and colors, instead of adding another palette. It stays selected.
- `colors-and-palettes.delete` From the dialog, a palette can be deleted,
  after confirmation. Current colors becomes the selected palette.
- `colors-and-palettes.download` From the dialog, a palette can be
  downloaded as a `.gpl` file.
- `colors-and-palettes.clone-current` Editing the **Current colors**
  palette instead creates a new palette, "Current colors clone",
  prefilled with the current colors.
- `colors-and-palettes.clone-empty` When the sprite has no colors, the clone starts
  with one black color.

### Importing palettes

- `colors-and-palettes.import` When creating a palette, the dialog can
  load a palette file. Supported formats: GIMP `.gpl`, `.pal`, `.txt`, and
  images (each distinct color of the image becomes a palette color).
- `colors-and-palettes.import-name` A palette imported from a file is named after
  the file, with its extension. One imported from an image adds " palette" after
  that name.
- `colors-and-palettes.import-draft` A palette imported in the dialog isn't saved
  until the dialog's save button is clicked, and it can still be changed.
- `colors-and-palettes.import-image-order` The colors of an image are sorted like
  the Current colors palette, not in the order they appear in the image.
- `colors-and-palettes.import-image-limit` An image with more than 256 distinct
  colors is refused with an error message that gives its number of colors, and the
  dialog keeps its colors.
- `colors-and-palettes.drop` Palette files (`.gpl`, `.pal`, `.txt`) can
  also be dropped on the editor; the imported palette is saved and
  selected.
- `colors-and-palettes.messages` Saving a palette shows a confirmation
  message; a palette file with no colors, loaded in the palette dialog, shows
  an error message.
- `colors-and-palettes.storage` Palettes are saved in this browser, not in
  `.piskel` files.

## UI and shortcuts

- Color pickers at the bottom of the left toolbar.
- Palettes panel in the right column, palette dialog.
- Shortcuts: `X`, `D`, `alt+P`, `1`–`9`, `<`, `>`.
