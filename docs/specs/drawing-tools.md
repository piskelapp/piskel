# Drawing tools

## Purpose

Tools that change pixels on the current frame of the current layer. They
are the core of the editor.

## Behavior

Common to all drawing tools:

- `drawing-tools.mouse-buttons` The **left button** uses the primary
  color, the **right button** uses the secondary color.
- `drawing-tools.highlight` Hovering the canvas highlights the target pixel
  with an overlay: dark over light pixels (lightness above 50%), and light over
  any other pixel, including transparent ones.
- `drawing-tools.highlight-size` The highlight covers the pen size on tools that
  use it, and one pixel on the others.
- `drawing-tools.highlight-outside` Moving the mouse off the sprite removes the
  highlight.
- `drawing-tools.undo` Each completed stroke or shape is a single undo
  step.
- `drawing-tools.tooltips` Each tool's tooltip shows its name, its
  current key and its modifier keys.
- `drawing-tools.clipping` Pixels outside the canvas bounds are ignored,
  so shapes and strokes that extend past the edge are clipped.
- `drawing-tools.transparent-color` Drawing with a transparent color is
  allowed and behaves like erasing.

`alt`+click and middle-click pick a color whatever the tool, see
[canvas.md](canvas.md).

| Claim | Tool | Key | Behavior | Modifiers |
| --- | --- | --- | --- | --- |
| `drawing-tools.pen` | Pen | `P` | Draws pixels along the mouse path, with no gaps when the mouse moves fast. |  |
| `drawing-tools.mirror-pen` | Vertical mirror pen | `V` | Draws and mirrors each pixel across the vertical center axis. | `ctrl`: horizontal axis instead. `shift`: both axes (4-way). |
| `drawing-tools.paint-bucket` | Paint bucket | `B` | Flood-fills the contiguous area of the same color (4-connected). |  |
| `drawing-tools.magic-bucket` | Magic bucket | `A` | Replaces every pixel of the clicked color in the frame. | `ctrl`: all layers. `shift`: all frames. |
| `drawing-tools.eraser` | Eraser | `E` | Pen that draws transparent pixels. |  |
| `drawing-tools.stroke` | Stroke | `L` | Straight line from press to release, previewed while dragging. | `shift`: draw a "uniform" line, with the same number of pixels on each step (horizontal, vertical, 45°, 2:1, 3:1, ...). |
| `drawing-tools.rectangle` | Rectangle | `R` | Hollow rectangle from press to release. | `shift`: square. |
| `drawing-tools.circle` | Circle | `C` | Hollow ellipse inscribed in the dragged box. | `shift`: circle. |
| `drawing-tools.move` | Move | `M` | Drags the frame content; pixels pushed outside are lost. | `alt`: wrap around the borders. `ctrl`: all layers. `shift`: all frames. |
| `drawing-tools.lighten` | Lighten | `U` | Lightens pixels under the pen; repeated passes keep lightening. | `ctrl`: darken. |
| `drawing-tools.dithering` | Dithering | `T` | Draws a checkerboard alternating primary and secondary colors. |  |
| `drawing-tools.color-picker` | Color picker | `O` | Click picks the color under the cursor as primary (right-click: secondary). |  |

- `drawing-tools.lighten-once` With `shift`, lighten applies only once per
  pixel per stroke, with a stronger step.
- `drawing-tools.dithering-right-button` Dithering with the right button
  swaps the primary and secondary colors in the checkerboard.

### Pen size

- `drawing-tools.pen-size-tools` Pen size applies to pen, mirror pen,
  eraser, lighten, dithering, stroke, rectangle and circle.
- `drawing-tools.pen-size-picker` The picker in the tool section offers
  sizes 1 to 4. The default size is 1.
- `drawing-tools.pen-size-shortcuts` `[` and `]` decrease/increase the
  size between 1 and 32. Above 4, the size-4 option is shown with the
  actual size as a label.
- `drawing-tools.pen-size-saved` The size is persisted as a user setting.

## UI and shortcuts

Tool buttons in the left toolbar, with
the pen size picker above them and the primary/secondary color pickers
below. Tool keys are listed in the table above and can be remapped (see
[keyboard-shortcuts.md](keyboard-shortcuts.md)).
