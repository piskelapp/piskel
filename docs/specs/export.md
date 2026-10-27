# Export

## Purpose

Get the sprite out of Piskel in formats other tools and game engines use.
For saving work to continue editing later, see
[save-and-storage.md](save-and-storage.md).

## Behavior

- `export.content` Exports always include all layers composed (respecting
  layer opacity) and all frames, including frames hidden from the preview.

### Scale and resolution

Shared by all tabs at the top of the Export drawer:

- `export.scale` The **scale** slider goes from 1x to 32x; pixels are
  replicated, never smoothed.
- `export.resolution` The **resolution** width and height inputs are kept
  in sync with the scale and with each other (the aspect ratio is fixed).

### GIF

- `export.gif` Downloads an animated GIF at the sprite's FPS, encoded in a
  Web Worker (gif.js).
- `export.gif-loop` **Loop repeatedly** checkbox (on by default); off plays
  once.
- `export.gif-transparency` If the sprite has fewer than 256 colors and no
  layer has an opacity below 1, an unused color is picked as the GIF's
  transparent color. Otherwise transparent pixels are rendered on white.
- `export.gif-warning` A warning is shown when the sprite has 256 colors or
  more.

`misc/gif-tests/` has sprites for checking GIF transparency by hand.

### PNG

- `export.png-spritesheet` **Spritesheet**: all frames in a grid. Columns
  and rows can be set (they constrain each other); the default is the best
  fit. The resulting dimensions are displayed.
- `export.png-download` **Download** saves the spritesheet as a `.png`.
- `export.png-data-uri` **Open** shows the spritesheet as a data URI in a
  new window.
- `export.pixi` **PixiJS movie**: a ZIP containing the spritesheet PNG and
  a JSON metadata file describing each frame. Option to inline the image as
  a data URI in the JSON.
- `export.png-selected-frame` **Selected frame**: downloads only the
  current frame as a `.png`.

### ZIP

- `export.zip` One PNG per frame, named with a configurable **prefix**
  (default `sprite_`) and the zero-padded frame number, starting at 0.
- `export.zip-split-layers` **Split by layers**: one PNG per layer per
  frame (`l<layer>_<prefix><frame>.png`), with layers numbered from 0
  (bottom layer) and frames from 1.
- `export.zip-layer-names` With **index by layer names** (only offered
  when splitting by layers), the layer name replaces the layer number.

### Others

- `export.c-file` **C file**: a `.c` source file with `#define`s for the
  frame count, width and height, and a `uint32_t` array of pixel data per
  frame. Always at 1x: the export scale is ignored.

## UI and shortcuts

Export drawer in the right toolbar, with GIF, PNG, Zip and Others tabs.
No shortcuts.

## Settings

- `EXPORT_SCALE` (default `1`)
- `EXPORT_TAB` (default `"gif"`)
- `EXPORT_GIF_REPEAT` (default `true`)

## Known issues

- ZIP frame numbers start at 0 for a merged export but at 1 when split by
  layers.
