# Frames

## Purpose

Manage the frames of the animation: the timeline in the left column.

## Behavior

- `frames.at-least-one` A sprite always has at least one frame. A new
  sprite starts with one frame.
- `frames.all-layers` Frame *i* exists in every layer; adding or removing
  a frame affects all layers.
- `frames.tiles` Each frame is shown as a tile with a thumbnail of all
  visible layers composed, and its number.
- `frames.select` Clicking a tile makes it the current frame.
- `frames.navigate` `up` / `down` select the previous / next frame.
- `frames.add` The "add new frame" tile at the bottom appends an empty
  frame at the end of the animation and selects it.
- `frames.add-shortcut` `N` inserts an empty frame after the current one
  and selects it.
- `frames.duplicate` The tile's clone action, or `shift+N`, inserts a copy
  of the frame after it and selects it.
- `frames.delete` The tile's delete action removes the frame. Hidden when
  there is only one frame.
- `frames.delete-selection` Deleting the current frame selects the
  previous one (or the new first frame).
- `frames.reorder` Dragging a tile by its handle moves the frame. The
  handle is hidden when there is only one frame.
- `frames.visibility` Clicking the frame number toggles whether the frame
  is played in the animated preview. All frames are visible by default.
  Hidden frames are still edited, saved and exported; they are only
  skipped by the preview.
- `frames.visibility-sync` Hidden frame indexes are kept in sync when
  frames are added, removed or moved.
- `frames.visibility-saved` Hidden frames are saved in `.piskel` files.
- `frames.overflow` With many frames, the list scrolls, with visual hints
  at the top and bottom when content overflows.
- `frames.undo` Every operation above, except selection, is one undo step.

## UI and shortcuts

Frames list in the left column.
Shortcuts: `up`, `down`, `N`, `shift+N`.

## Settings

None.

## Known issues

- Deleting a hidden frame leaves its index in the hidden list, so the frame
  that takes its place becomes hidden. Found by reading
  `PiskelController.removeFrameAt`, not reproduced.
- Undo can lose hidden frames: see [undo-redo.md](undo-redo.md).
