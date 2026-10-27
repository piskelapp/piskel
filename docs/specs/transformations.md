# Transformations

## Purpose

One-click operations that transform the content of a frame, or of the
whole sprite.

## Behavior

Transformations apply immediately on click; they are not modes. By default
they affect the current frame of the current layer. Modifiers:

- `ctrl`: apply to all layers.
- `shift`: apply to all frames.

| Tool | Default | Modifiers |
| --- | --- | --- |
| Flip | Flip horizontally. | `alt`: flip vertically. `ctrl`, `shift` as above. |
| Rotate | Rotate 90° counter-clockwise. | `alt`: clockwise. `ctrl`, `shift` as above. |
| Clone | Copy the current frame of the current layer to every frame of that layer. | None. |
| Center | Move the content so its bounding box is centered. | `ctrl`, `shift` as above. |
| Crop | Resize the sprite to the bounding box of its content, or to the current selection if there is one. Always applies to all frames and layers. | None. |

- Each transformation is a single undo step.
- Rotation of a non-square sprite rotates around the center; pixels that
  fall outside the canvas are lost, and uncovered areas become transparent.
- Crop does nothing when the content already fills the canvas or the
  sprite is empty. It dismisses the current selection.

## UI and shortcuts

The "Transform" panel in the right column. Only the first tools are visible
by default; "View more tools" expands the panel. No keyboard shortcuts.

## Test gaps

- No readable integration tests for clone, center and crop; they are only
  covered by recorded sessions.
- Rotate with `ctrl` (all layers).
