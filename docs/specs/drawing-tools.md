# Drawing tools

## Purpose

Tools that change pixels on the current frame of the current layer. They
are the core of the editor.

## Behavior

Common to all drawing tools:

- **Left button** uses the primary color, **right button** uses the
  secondary color.
- **Alt+click** (or middle-click without dragging) picks the color under the
  cursor, with any tool except move (where `alt` wraps). See
  [canvas.md](canvas.md).
- Hovering the canvas highlights the target pixel(s) with a light or dark
  overlay depending on the pixel underneath.
- Each completed stroke or shape is a single undo step.
- Modifier keys are listed in each tool's tooltip.

| Tool | Key | Behavior | Modifiers |
| --- | --- | --- | --- |
| Pen | `P` | Draws pixels along the mouse path, with no gaps when the mouse moves fast. |  |
| Vertical mirror pen | `V` | Draws and mirrors each pixel across the vertical center axis. | `ctrl`: horizontal axis. `shift`: both axes (4-way). |
| Paint bucket | `B` | Flood-fills the contiguous area of the same color (4-connected). |  |
| Magic bucket | `A` | Replaces every pixel of the clicked color in the frame. | `ctrl`: all layers. `shift`: all frames. |
| Eraser | `E` | Pen that draws transparent pixels. |  |
| Stroke | `L` | Straight line from press to release, previewed while dragging. | `shift`: draw a "uniform" line, with the same number of pixels on each step (horizontal, vertical, 45°, 2:1, 3:1, ...). |
| Rectangle | `R` | Hollow rectangle from press to release. | `shift`: square. |
| Circle | `C` | Hollow ellipse inscribed in the dragged box. | `shift`: circle. |
| Move | `M` | Drags the frame content; pixels pushed outside are lost. | `ctrl`: all layers. `shift`: all frames. `alt`: wrap around the borders. |
| Lighten | `U` | Lightens pixels under the pen; repeated passes keep lightening. | `ctrl`: darken. `shift`: apply only once per pixel per stroke (stronger step). |
| Dithering | `T` | Draws a checkerboard alternating primary and secondary colors. |  |
| Color picker | `O` | Click picks the color under the cursor as primary (right-click: secondary). |  |

### Pen size

- Applies to pen, mirror pen, eraser, lighten, dithering, stroke,
  rectangle and circle.
- The picker in the tool section offers sizes 1 to 4. `[` and `]`
  decrease/increase the size between 1 and 32. Above 4, the size-4 option
  is shown with the actual size as a label.
- The size is persisted as a user setting.

### Edge cases

- Pixels outside the canvas bounds are ignored, so shapes and strokes that
  extend past the edge are clipped.
- Drawing with a transparent color is allowed and behaves like erasing.

## UI and shortcuts

Tool buttons in the left toolbar, with
the pen size picker above them and the primary/secondary color pickers
below. Tool keys are listed in the table above and can be remapped (see
[keyboard-shortcuts.md](keyboard-shortcuts.md)).

## Test gaps

- Lighten with `shift` (once per pixel).
- Dithering with the right button.
- Pen size above 4.
