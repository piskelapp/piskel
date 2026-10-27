# Layers

## Purpose

Stack independent drawings on top of each other. Every layer has the same
frames, so a layer can hold for example a character's outline and another
its colors, across the whole animation.

## Behavior

- `layers.at-least-one` A sprite always has at least one layer. A new
  sprite starts with one layer.
- `layers.list-order` The list shows the top layer first; drawing applies
  to the current (highlighted) layer.
- `layers.select` Clicking a layer makes it the current layer.
- `layers.add` The add button creates an empty layer above the current
  one, named "Layer N", and selects it.
- `layers.duplicate` `shift`+click on the add button duplicates the
  current layer instead.
- `layers.rename` The edit button or double-click opens an inline input.
  `Enter` confirms.
- `layers.rename-cancel` `Escape` or clicking elsewhere (blur) cancels the
  rename.
- `layers.move` Move up / down moves the current layer one step.
  `shift`+click moves it to the top / bottom.
- `layers.move-disabled` Move up is disabled for the top layer, move down
  for the bottom layer.
- `layers.merge-down` Merge down merges the current layer into the one
  below. Disabled for the bottom layer.
- `layers.delete` Delete removes the current layer and selects the one
  below.
- `layers.delete-disabled` Delete is disabled when there is only one
  layer.
- `layers.opacity` Clicking the opacity indicator of a layer prompts for a
  value between 0 and 1. Dismissing the prompt, or entering an invalid or
  out-of-range value, leaves the opacity unchanged. New layers have an
  opacity of 1.
- `layers.opacity-indicator` The indicator's color shows whether the layer
  is opaque (gold), fully transparent (gray) or in between (white).
- `layers.opacity-rendering` Opacity applies to the canvas, the preview
  and exports.
- `layers.preview` Layer preview (`alt+L`, or the toggle at the top of the
  list): when on, the layers above and below the current one are drawn on
  the canvas at the "layer opacity" set in preferences. When off, only the
  current layer is shown on the canvas. On by default.
- `layers.undo` Every operation above, except selection and layer preview,
  is one undo step.

## UI and shortcuts

Layers panel in the right column.
Shortcut: `alt+L` toggles layer preview.

## Settings

- `LAYER_PREVIEW` (default `true`)
- `LAYER_OPACITY` (default `0.2`): opacity used to draw the other layers on
  the canvas.

## Known issues

- Setting the opacity uses a native `window.prompt`.
- Blurring the rename input discards the typed name. This may not be
  intended: the blur handler goes through the same path as `Escape`.
