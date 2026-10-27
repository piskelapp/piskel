# Import

## Purpose

Bring existing artwork into Piskel: images, spritesheets, animated GIFs
and `.piskel` files, either as a new sprite or combined with the current
one.

## Behavior

### Entry points

The **Import** drawer (right toolbar) offers:

- **Browse images**: any image the browser can decode (PNG, JPG, BMP,
  animated GIF, ...). Opens the import wizard.
- **Browse .piskel files**: loads a `.piskel` file. Opens the wizard at the
  "replace or combine" step.
- **Browse local saves**: sprites saved in this browser (see
  [save-and-storage.md](save-and-storage.md)).
- **Browse backups**: automatic session backups (see
  [save-and-storage.md](save-and-storage.md)).

**Drag and drop** on the editor:

- A single image smaller than or equal to the canvas is drawn into the
  current frame at the drop position, without the wizard.
- A single image larger than the canvas opens the import wizard.
- Several images: for each image, a new frame is inserted after the
  current one and the image is drawn at the drop position, whatever its
  size (no wizard).
- A `.piskel` file replaces the current sprite, after confirmation.
- A palette file (`.gpl`, `.pal`, `.txt`) is imported as a palette.

**Paste** of an image from the system clipboard behaves like dropping it at
the top-left corner (see [selection.md](selection.md)).

### Import wizard

1. **Image import** (images only): choose **single image** (optionally
   resized to a given size, with or without smoothing) or **spritesheet**
   (frame width/height and X/Y offset, previewed on the image). An animated
   GIF imports each GIF frame as a frame.
2. **Select mode**: **Replace** your sprite, or **Combine** with it. When
   importing an image into an empty sprite, this step is skipped and the
   import replaces it. A `.piskel` file always shows this step.
3. **Adjust size** (combine only, when the sizes differ): **expand** the
   canvas to fit the imported content, or **keep** the current size; an
   anchor picks where the content is placed.
4. **Insert location** (combine only): pick a frame, then insert the
   imported frames **as new frames** after it, or **in existing frames**
   starting at it.

When combining, each imported layer is always added as a new layer named
"<name> (imported)"; the insert location only decides whether new frames
are created. Replacing always asks for confirmation (`window.confirm`),
even when the current sprite is empty.

Both replace and combine are a single undo step.

## UI and shortcuts

Import drawer, import wizard dialog. No shortcuts.

## Settings

None.

## Test gaps

- Combine mode: adjust size (expand/keep, anchor) and insert location (new
  frames vs existing frames).
- Animated GIF import.
- Drag and drop (single small image, multiple images, `.piskel`).
- Pasting an image from the clipboard.

## Known issues

- When dropping several images, each new frame is selected and then
  `selectNextFrame` moves one frame further, so unless the current frame is
  the last one, images are drawn on existing frames rather than on the new
  empty ones. Found by reading `FileDropperService.onImageLoaded_`, not
  reproduced.
- `onRestorePreviousSessionClick_` in `ImportController` is not wired
  to any element. Likely dead code left over from before the backups
  dialog.
