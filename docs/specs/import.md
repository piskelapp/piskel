# Import

## Purpose

Bring existing artwork into Piskel: images, spritesheets, animated GIFs
and `.piskel` files, either as a new sprite or combined with the current
one.

## Behavior

### Entry points

The **Import** drawer (right toolbar) offers:

- `import.browse-images` **Browse images**: any image the browser can
  decode (PNG, JPG, BMP, animated GIF, ...). Opens the import wizard.
- `import.browse-piskel` **Browse .piskel files**: loads a `.piskel` file.
  Opens the wizard at the "replace or combine" step.
- `import.browse-local` **Browse local saves**: sprites saved in this
  browser (see [save-and-storage.md](save-and-storage.md)).
- `import.browse-backups` **Browse backups**: automatic session backups
  (see [save-and-storage.md](save-and-storage.md)).

**Drag and drop** on the editor:

- `import.drop-small-image` A single image smaller than or equal to the
  canvas is drawn into the current frame at the drop position, without the
  wizard.
- `import.drop-large-image` A single image larger than the canvas opens
  the import wizard.
- `import.drop-several-images` Several images: for each image, a new frame
  is inserted after the current one and the image is drawn at the drop
  position, whatever its size (no wizard).
- `import.drop-piskel` A `.piskel` file replaces the current sprite, after
  confirmation.

Dropped palette files are covered in
[colors-and-palettes.md](colors-and-palettes.md), pasted images in
[selection.md](selection.md): they behave like an image dropped at the
top-left corner.

### Import wizard

- `import.single-image` **Image import** step, **single image**: the image
  becomes one frame, optionally resized to a given size, with or without
  smoothing.
- `import.spritesheet` **Image import** step, **spritesheet**: the image is
  cut into frames by frame width/height and X/Y offset, previewed on the
  image.
- `import.animated-gif` An animated GIF imports each GIF frame as a frame.
- `import.select-mode` **Select mode** step: **Replace** your sprite, or
  **Combine** with it. A `.piskel` file always shows this step.
- `import.empty-sprite` When importing an image into an empty sprite, the
  select mode step is skipped and the import replaces the sprite.
- `import.adjust-size` **Adjust size** step (combine only, when the sizes
  differ): **expand** the canvas to fit the imported content, or **keep**
  the current size; an anchor picks where the content is placed.
- `import.insert-location` **Insert location** step (combine only): pick a
  frame, then insert the imported frames **as new frames** after it, or
  **in existing frames** starting at it.
- `import.combine-layers` When combining, each imported layer is always
  added as a new layer named "<name> (imported)"; the insert location only
  decides whether new frames are created.
- `import.replace-confirm` Replacing always asks for confirmation
  (`window.confirm`), even when the current sprite is empty.
- `import.undo` Both replace and combine are a single undo step.

## UI and shortcuts

Import drawer, import wizard dialog. No shortcuts.

## Settings

None.

## Known issues

- When dropping several images, each new frame is selected and then
  `selectNextFrame` moves one frame further, so unless the current frame is
  the last one, images are drawn on existing frames rather than on the new
  empty ones. Found by reading `FileDropperService.onImageLoaded_`, not
  reproduced.
- `onRestorePreviousSessionClick_` in `ImportController` is not wired
  to any element. Likely dead code left over from before the backups
  dialog.
