# Editor

## Purpose

What every session has in common, whatever the feature: how the editor
starts, and how it talks to the user through dialogs, notifications and
progress bars.

## Behavior

### Startup

- `editor.loading` A "Loading Piskel ..." screen is shown until the editor
  is ready.
- `editor.new-sprite` The editor starts on a new sprite named "New
  Piskel", at the default size (32×32 out of the box, see
  [settings.md](settings.md)), with one layer "Layer 1", one frame and 12
  FPS (or the maximum FPS preference, if lower). The pen tool is selected,
  and the colors are black and transparent.
- `editor.unsupported-browser` In browsers other than Chrome, Firefox and
  Edge, a dialog at startup warns that the browser is not supported and
  names it (Safari or Opera), or shows its full identity for any other
  browser. Browsers based on Chrome count as Chrome, except Opera.

### Dialogs

- `editor.dialogs` Only one dialog is open at a time. A dialog closes with
  its close button, `Escape`, or a click outside it.

### Feedback

- `editor.notifications` Messages (save results, import errors, warnings)
  appear one at a time in a notification with a close button; all hide
  themselves after a few seconds.
- `editor.progress-bar` Long tasks, such as building a GIF or reading an
  image palette, show a progress bar with a percentage, only when they
  take more than 300 ms.

## UI and shortcuts

`Escape` closes the open dialog.
