# Export

## Purpose

Get the sprite out of Piskel in formats other tools and game engines use.
For saving work to continue editing later, see
[save-and-storage.md](save-and-storage.md).

## Behavior

Exports always include all layers composed (respecting layer opacity) and
all frames, including frames hidden from the preview.

### Scale and resolution

Shared by all tabs at the top of the Export drawer:

- **Scale** slider from 1x to 32x (1x by default); pixels are replicated,
  never smoothed.
- **Resolution** width and height inputs, kept in sync with the scale and
  with each other (the aspect ratio is fixed).

### GIF

- Downloads an animated GIF at the sprite's FPS.
- **Loop repeatedly** checkbox (on by default); off plays once.
- Transparency: if the sprite has fewer than 256 colors and no layer has
  an opacity below 1, an unused color is picked as the GIF's transparent
  color. Otherwise transparent pixels are rendered on white. A warning is
  shown when the sprite has 256 colors or more.

### PNG

- **Spritesheet**: all frames in a grid. Columns and rows can be set (they
  constrain each other); the default is the best fit. The resulting
  dimensions are displayed.
- **Download** the spritesheet as a `.png`, or **open** it as a data URI in
  a new window.
- **PixiJS movie**: a ZIP containing the spritesheet PNG and a JSON
  metadata file describing each frame. Option to inline the image as a data
  URI in the JSON.
- **Selected frame**: downloads only the current frame as a `.png`.

### ZIP

- One PNG per frame, named with a configurable **prefix** (default
  `sprite_`) and the zero-padded frame number, starting at 0.
- **Split by layers**: one PNG per layer per frame
  (`l<layer>_<prefix><frame>.png`), with layers numbered from 0 (bottom
  layer) and frames from 1. With **index by layer names**, the layer name
  replaces the layer number.

### Others

- **C file**: a `.c` source file with `#define`s for the frame count, width
  and height, and a `uint32_t` array of pixel data per frame. Always at 1x:
  the export scale is ignored.

## UI and shortcuts

Export drawer in the right toolbar, with GIF, PNG, Zip and Others tabs.
No shortcuts.

## Test gaps

- GIF content: frame count, timing, transparency handling, the
  too-many-colors warning. `misc/gif-tests/` has manual test sprites for
  this.
- Layer opacity in exports.
