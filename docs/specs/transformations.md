# Transformations

## Purpose

One-click operations that transform the content of a frame, or of the
whole sprite.

## Behavior

Transformations apply immediately on click; they are not modes. By default
they affect the current frame of the current layer. Modifiers:

- `ctrl`: apply to all layers.
- `shift`: apply to all frames.

| Tool | Id | Default | Modifiers |
| --- | --- | --- | --- |
| Flip | `tool-flip` | Flip horizontally. | `alt`: flip vertically. `ctrl`, `shift` as above. |
| Rotate | `tool-rotate` | Rotate 90° counter-clockwise. | `alt`: clockwise. `ctrl`, `shift` as above. |
| Clone | `tool-clone` | Copy the current frame of the current layer to every frame of that layer. | None. |
| Center | `tool-center` | Move the content so its bounding box is centered. | `ctrl`, `shift` as above. |
| Crop | `tool-crop` | Resize the sprite to the bounding box of its content, or to the current selection if there is one. Always applies to all frames and layers. | None. |

- Each transformation is a single undo step.
- Rotation of a non-square sprite rotates around the center; pixels that
  fall outside the canvas are lost, and uncovered areas become transparent.
- Crop does nothing when the content already fills the canvas or the
  sprite is empty. It dismisses the current selection.

## UI and shortcuts

The "Transform" panel in the right column. Only the first tools are visible
by default; "View more tools" expands the panel. No keyboard shortcuts.

## Settings

- `TRANSFORM_SHOW_MORE` (default `false`): whether the panel is expanded.

## Test gaps

- No readable integration tests for clone, center and crop; they are only
  covered by recorded sessions.
- Rotate with `ctrl` (all layers).

## Known issues

- Crop does nothing when the content (or selection) is a single column
  wide (`Crop.applyTool_` treats `minx >= maxx` as empty).
