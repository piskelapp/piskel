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
  canvas is drawn into the current frame, centered on the drop position and
  kept inside the canvas, without the wizard.
- `import.drop-large-image` A single image larger than the canvas opens
  the import wizard.
- `import.drop-several-images` Several images: for each image, a new frame
  is inserted after the current one and the image is drawn centered on the
  drop position, whatever its size (no wizard).
- `import.drop-piskel` A `.piskel` file replaces the current sprite, after
  confirmation.

Dropped palette files are covered in
[colors-and-palettes.md](colors-and-palettes.md), pasted images in
[selection.md](selection.md): they behave like an image dropped at the
top-left corner.

### Import wizard

- `import.step-summary` After the first step, each step shows a preview of the
  imported content with its name, size, frame count and layer count.
- `import.back` **Back** returns to the previous step, with the choices made
  there. Choices on later steps may not be kept when going forward again. The first
  step has no back button.
- `import.cancel` Closing the wizard at any step leaves the sprite unchanged.

#### Image import step

- `import.image-step` The step shows the file's name and a preview of the image.
  **Single image** is selected by default, the resize and frame size fields start at the
  image's size, and the offset starts at 0.
- `import.auto-select-type` Typing in the resize fields selects **single image**;
  typing in the frame size or offset fields selects **spritesheet**.

**Single image:**

- `import.single-image` The image becomes one frame, optionally resized to a
  given size (keeping its aspect ratio), with or without smoothing. The size
  defaults to the size of the image.
- `import.resize-aspect` Typing in one resize field updates the other to keep the
  image's aspect ratio, rounded to the nearest pixel.
- `import.resize-smoothing` Smooth resize is on by default and blends pixels when
  resizing. Turned off, resized pixels keep hard edges and their exact colors.

**Spritesheet:**

- `import.spritesheet` The image is cut into frames by frame width/height and
  X/Y offset, previewed on the image. The frame size defaults to the size of the
  image, and the offset to 0x0.
- `import.sheet-size` The sprite takes the frame size, which doesn't have to be
  square.
- `import.sheet-order` Frames are read left to right, then top to bottom.
- `import.sheet-offset` The offset sets where the first frame starts, on every
  row. Frames follow each other with no gap between them.
- `import.sheet-empty-cells` Fully transparent cells are skipped, so they don't
  create frames.
- `import.sheet-partial-cells` Cells that don't fit entirely in the image are
  ignored.
- `import.sheet-grid` With **spritesheet** selected, a grid on the preview shows
  the frames that will be cut, and updates as the fields change. It's hidden with
  **single image**.
- `import.sheet-invalid` When importing or drawing the grid, a frame size below 1
  becomes 1, an offset below 0 becomes 0, and text counts as those minimums.

**Animated GIFs:**

- `import.animated-gif` An animated GIF imports each GIF frame as a frame.
- `import.gif-sheet` An animated GIF is never cut as a spritesheet: each GIF frame
  stays a frame, even with **spritesheet** selected.

#### Select mode step

- `import.select-mode` **Select mode** step: **Replace** your sprite, or
  **Combine** with it. A `.piskel` file always shows this step.
- `import.empty-sprite` When importing an image into an empty sprite, the
  select mode step is skipped and the import replaces the sprite.
- `import.replace-result` **Replace** takes the imported name, description and
  FPS, and selects the first frame and first layer.
- `import.image-fps` An image imported as a new sprite gets the default FPS.

#### Adjust size step

- `import.adjust-size` **Adjust size** step (combine only, when the sizes
  differ): when the imported content is bigger, **expand** the canvas to
  fit it (the default) or **keep** the current size and crop it. An anchor
  picks where the content is placed; when the content is smaller, only the
  anchor is shown.
- `import.adjust-expand` **Expand** grows the canvas to the larger width and the
  larger height of the two sprites, so it can grow in one direction only. The
  anchor places both the current sprite and the imported content.
- `import.adjust-keep` **Keep** leaves the canvas size unchanged, and warns that
  the imported content will be cropped. The anchor picks which part is kept.
- `import.adjust-smaller` Content that fits in the canvas leaves its size
  unchanged, and the anchor places it.
- `import.adjust-anchor` The anchor starts at the top left corner and offers nine
  positions. Its label names what it does: resize, crop or position.

#### Insert location step

- `import.insert-location` **Insert location** step (combine only): pick a
  frame, then insert the imported frames **as new frames** after it, or
  **in existing frames** starting at it.
- `import.insert-defaults` The step starts on the current frame, with **as new
  frames** selected.
- `import.insert-new-frames` **As new frames** can also insert before the first
  frame. New frames are empty on the existing layers, and imported layers are empty
  on all the other frames.
- `import.insert-existing` **In existing frames** adds no frames while the imported
  frames fit. Imported layers are empty on the frames before the picked one.
- `import.insert-overflow` **In existing frames** adds frames when the imported
  frames go past the last one.

#### Combining

- `import.combine-layers` When combining, each imported layer is always
  added as a new layer named "<name> (imported)"; the insert location only
  decides whether new frames are created.
- `import.combine-selection` After combining, the first imported layer
  becomes the current layer.
- `import.combine-first-frame` After combining, the first frame is selected.
- `import.combine-keeps-sprite` Combining keeps the current sprite's name,
  description and FPS.

#### All imports

- `import.image-name` An image imported as a new sprite names the sprite
  after the file, without its extension.
- `import.piskel-error` An invalid `.piskel` file, browsed or dropped,
  shows an error message.
- `import.replace-confirm` Replacing always asks for confirmation, even when
  the current sprite is empty.
- `import.undo` Both replace and combine are a single undo step.

## UI and shortcuts

Import drawer, import wizard dialog. No shortcuts.
