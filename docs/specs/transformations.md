# Transformations

## Purpose

One-click operations that transform the content of a frame, or of the
whole sprite.

## Behavior

Transformations apply immediately on click; they are not modes. By default
they affect the current frame of the current layer.

- `transformations.all-layers` `ctrl`+click applies the transformation to
  all layers (flip, rotate, center).
- `transformations.all-frames` `shift`+click applies the transformation to
  all frames (flip, rotate, center).

| Claim | Tool | Id | Behavior |
| --- | --- | --- | --- |
| `transformations.flip` | Flip | `tool-flip` | Flips horizontally; with `alt`, vertically. |
| `transformations.rotate` | Rotate | `tool-rotate` | Rotates 90° counter-clockwise; with `alt`, clockwise. |
| `transformations.clone` | Clone | `tool-clone` | Copies the current frame of the current layer to every frame of that layer. No modifiers. |
| `transformations.center` | Center | `tool-center` | Moves the content so its bounding box is centered. |
| `transformations.crop` | Crop | `tool-crop` | Resizes the sprite to the bounding box of its content. Always applies to all frames and layers. No modifiers. |
| `transformations.crop-selection` | Crop | `tool-crop` | With a selection, resizes the sprite to the selection instead, and dismisses the selection. |

- `transformations.undo` Each transformation is a single undo step.
- `transformations.rotate-non-square` Rotation of a non-square sprite
  rotates around the center; pixels that fall outside the canvas are lost,
  and uncovered areas become transparent.
- `transformations.crop-noop` Crop does nothing when the content already
  fills the canvas or the sprite is empty.
- `transformations.show-more` Only the first tools are visible by default;
  "View more tools" expands the panel and clicking it again collapses it.
- `transformations.show-more-saved` Whether the panel is expanded is
  remembered across sessions.

## UI and shortcuts

The "Transform" panel in the right column. No keyboard shortcuts.

## Settings

- `TRANSFORM_SHOW_MORE` (default `false`): whether the panel is expanded.

## Known issues

- Crop does nothing when the content (or selection) is a single column
  wide (`Crop.applyTool_` treats `minx >= maxx` as empty).
