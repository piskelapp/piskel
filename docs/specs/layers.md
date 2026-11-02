# Layers

## Purpose

Stack independent drawings on top of each other. Every layer has the same
frames, so a layer can hold for example a character's outline and another
its colors, across the whole animation.

## Behavior

- A sprite always has at least one layer. The list shows the top layer
  first; drawing applies to the current (highlighted) layer.
- **Select**: click a layer.
- **Add**: the add button creates an empty layer above the current one,
  named "Layer N". `shift`+click duplicates the current layer instead.
- **Rename**: the edit button or double-click opens an inline input.
  `Enter` or blur confirms, `Escape` cancels.
- **Move up / down**: moves the current layer one step. `shift`+click moves
  it to the top / bottom. Disabled at the top / bottom.
- **Merge down**: merges the current layer into the one below. Disabled for
  the bottom layer.
- **Delete**: removes the current layer and selects the one below. Disabled
  when there is only one layer.
- **Opacity**: clicking the opacity indicator of a layer prompts for a value
  between 0 and 1. The indicator's color shows whether the layer is opaque,
  transparent or in between. Opacity applies to the canvas, the preview and
  exports _(to confirm for exports)_.
- **Layer preview** (`alt+L`, or the toggle at the top of the list): when
  on, the layers above and below the current one are drawn on the canvas at
  the "layer opacity" set in preferences. When off, only the current layer
  is shown on the canvas.
- Every operation above, except selection and layer preview, is one undo
  step.

## UI and shortcuts

Layers panel in the right column.
Shortcut: `alt+L` toggles layer preview.

## Settings

- `LAYER_PREVIEW` (default `true`)
- `LAYER_OPACITY` (default `0.2`): opacity used to draw the other layers on
  the canvas.

## Test gaps

- Opacity (prompt, rendering).
- Layer preview toggle and `alt+L`.
- Move up / down with readable integration tests; button disabled states.

## Known issues

- Setting the opacity uses a native `window.prompt`.
